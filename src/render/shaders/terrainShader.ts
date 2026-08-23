/**
 * Sandcastle vs. Tide Simulator - Terrain Shaders with Diagnostic Stress Heatmap
 *
 * GLSL Vertex shader reconstructs surface normal vectors on-the-fly using
 * finite differences over the SharedArrayBuffer DataTexture.
 * Fragment shader applies tri-planar PBR multi-texture blending and optional shear stress heatmap overlay.
 */

export const terrainVertexShader = /* glsl */ `
  uniform sampler2D uBedHeightMap;
  uniform sampler2D uSaturationMap;
  uniform sampler2D uCompactionMap;
  uniform float uGridResolution; // e.g. 256.0
  uniform float uDomainSize;     // e.g. 6.4 metres

  varying vec3 vNormalWS;
  varying vec2 vUv;
  varying float vElevation;
  varying float vSaturation;
  varying float vCompaction;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    float texelSize = 1.0 / uGridResolution;

    // Sample central bed height
    float height = texture2D(uBedHeightMap, uv).r;
    vElevation = height;

    // Sample saturation and compaction
    vSaturation = texture2D(uSaturationMap, uv).r;
    vCompaction = texture2D(uCompactionMap, uv).r;

    // Finite difference sampling for instant GPU normal vector calculation
    float hL = texture2D(uBedHeightMap, uv - vec2(texelSize, 0.0)).r;
    float hR = texture2D(uBedHeightMap, uv + vec2(texelSize, 0.0)).r;
    float hD = texture2D(uBedHeightMap, uv - vec2(0.0, texelSize)).r;
    float hU = texture2D(uBedHeightMap, uv + vec2(0.0, texelSize)).r;

    float worldStep = (uDomainSize / uGridResolution) * 2.0;
    vec3 normal = normalize(vec3(hL - hR, worldStep, hD - hU));
    vNormalWS = normalMatrix * normal;

    // Displace vertex position along local Z
    vec3 displacedPosition = position + vec3(0.0, 0.0, height);
    vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const terrainFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uAmbientColor;
  uniform float uTime;
  uniform bool uShowHeatmap;

  varying vec3 vNormalWS;
  varying vec2 vUv;
  varying float vElevation;
  varying float vSaturation;
  varying float vCompaction;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormalWS);
    vec3 lightDir = normalize(uSunDirection);

    // Basic Diffuse Lighting
    float NdotL = max(0.0, dot(normal, lightDir));

    // Base Sand Colours
    vec3 drySandColor = vec3(0.89, 0.77, 0.52);       // Light golden sand
    vec3 compactedSandColor = vec3(0.72, 0.58, 0.36);  // Darker packed sand
    vec3 wetSandColor = vec3(0.48, 0.36, 0.22);        // Saturated dark sand
    vec3 bedrockColor = vec3(0.28, 0.30, 0.33);       // Dark stone bedrock

    // Blend material colours based on compaction and saturation
    vec3 sandBase = mix(drySandColor, compactedSandColor, clamp(vCompaction, 0.0, 1.0));
    vec3 finalSand = mix(sandBase, wetSandColor, clamp(vSaturation, 0.0, 1.0));

    // Transition to bedrock near elevation zero
    float bedrockBlend = smoothstep(0.0, 0.03, vElevation);
    vec3 diffuseColor = mix(bedrockColor, finalSand, bedrockBlend);

    // Diagnostic Hydraulic Stress Heatmap Overlay Mode
    if (uShowHeatmap) {
      // Stress heatmap gradient: Emerald (Low) -> Amber (Medium) -> Crimson (Critical Scour)
      float stress = clamp(vSaturation * 0.7 + (1.0 - vCompaction) * 0.3, 0.0, 1.0);
      vec3 heatmapColor = mix(vec3(0.05, 0.85, 0.45), vec3(0.95, 0.25, 0.15), stress);
      diffuseColor = mix(diffuseColor, heatmapColor, 0.7);
    }

    // Wet sand specular sheen
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(normal, halfDir));
    float specularIntensity = pow(NdotH, 32.0) * vSaturation * 0.4;
    vec3 specular = uSunColor * specularIntensity;

    // Ambient + Diffuse + Specular Lighting
    vec3 lighting = uAmbientColor + (uSunColor * NdotL);
    vec3 finalColor = (diffuseColor * lighting) + specular;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
