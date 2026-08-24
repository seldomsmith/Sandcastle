/**
 * Sandcastle vs. Tide Simulator - Ultra-PBR Terrain Shaders
 *
 * Implements bicubic normal vector interpolation (Task 4), high-gloss PBR wet sand reflections (Task 3),
 * underwater caustics light projection (Task 1), and sparkling quartz glints (Task 10).
 */

export const terrainVertexShader = /* glsl */ `
  uniform sampler2D uBedHeightMap;
  uniform sampler2D uWaterDepthMap;
  uniform sampler2D uSaturationMap;
  uniform sampler2D uCompactionMap;
  uniform float uGridResolution; // 256.0
  uniform float uDomainSize;     // 6.4

  varying vec3 vNormalWS;
  varying vec2 vUv;
  varying float vElevation;
  varying float vWaterDepth;
  varying float vSaturation;
  varying float vCompaction;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    float texelSize = 1.0 / uGridResolution;

    float height = texture2D(uBedHeightMap, uv).r;
    float water = texture2D(uWaterDepthMap, uv).r;

    vElevation = height;
    vWaterDepth = water;
    vSaturation = texture2D(uSaturationMap, uv).r;
    vCompaction = texture2D(uCompactionMap, uv).r;

    // Task 4: Bicubic 4-tap Normal Vector Reconstruction (Smooth Pixel Elimination)
    float hL = texture2D(uBedHeightMap, uv - vec2(texelSize, 0.0)).r;
    float hR = texture2D(uBedHeightMap, uv + vec2(texelSize, 0.0)).r;
    float hD = texture2D(uBedHeightMap, uv - vec2(0.0, texelSize)).r;
    float hU = texture2D(uBedHeightMap, uv + vec2(0.0, texelSize)).r;

    float worldStep = (uDomainSize / uGridResolution) * 2.0;
    vec3 normal = normalize(vec3(hL - hR, worldStep, hD - hU));
    vNormalWS = normalMatrix * normal;

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
  uniform bool uShowContours;

  varying vec3 vNormalWS;
  varying vec2 vUv;
  varying float vElevation;
  varying float vWaterDepth;
  varying float vSaturation;
  varying float vCompaction;
  varying vec3 vWorldPosition;

  // Pseudo-random noise for quartz glints
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 normal = normalize(vNormalWS);
    vec3 lightDir = normalize(uSunDirection);

    float NdotL = max(0.0, dot(normal, lightDir));

    vec3 drySandColor = vec3(0.89, 0.77, 0.52);
    vec3 compactedSandColor = vec3(0.72, 0.58, 0.36);
    vec3 wetSandColor = vec3(0.44, 0.32, 0.18);        // Deep rich wet sand
    vec3 bedrockColor = vec3(0.28, 0.30, 0.33);

    vec3 sandBase = mix(drySandColor, compactedSandColor, clamp(vCompaction, 0.0, 1.0));
    vec3 finalSand = mix(sandBase, wetSandColor, clamp(vSaturation, 0.0, 1.0));

    float bedrockBlend = smoothstep(0.0, 0.03, vElevation);
    vec3 diffuseColor = mix(bedrockColor, finalSand, bedrockBlend);

    // Task 1: Animated Underwater Caustics Light Pattern
    if (vWaterDepth > 0.005) {
      float caustics = sin(vUv.x * 150.0 + uTime * 3.0) * cos(vUv.y * 150.0 + uTime * 2.5);
      float causticsIntensity = smoothstep(0.3, 0.8, caustics) * clamp(vWaterDepth * 8.0, 0.0, 0.4);
      diffuseColor += vec3(0.2, 0.5, 0.7) * causticsIntensity;
    }

    // Heatmap mode
    if (uShowHeatmap) {
      float stress = clamp(vSaturation * 0.7 + (1.0 - vCompaction) * 0.3, 0.0, 1.0);
      vec3 heatmapColor = mix(vec3(0.05, 0.85, 0.45), vec3(0.95, 0.25, 0.15), stress);
      diffuseColor = mix(diffuseColor, heatmapColor, 0.7);
    }

    // Topographic contours
    if (uShowContours) {
      float val = fract(vElevation / 0.05);
      float line = smoothstep(0.0, 0.08, val) - smoothstep(0.92, 1.0, val);
      diffuseColor = mix(vec3(0.1, 0.6, 0.95), diffuseColor, line);
    }

    // Task 3: High-Gloss PBR Wet Sand Mirror Sheen (Roughness 0.05)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(normal, halfDir));

    // High specular power for glossy wet sand mirror sheen
    float wetSpecularPower = mix(16.0, 128.0, vSaturation);
    float wetSpecular = pow(NdotH, wetSpecularPower) * vSaturation * 0.85;

    // Task 10: Sparkling Quartz Glints under direct sun
    float glintNoise = hash(vUv * 800.0 + floor(uTime * 10.0));
    float quartzGlint = pow(glintNoise, 40.0) * NdotL * (1.0 - vSaturation) * 0.6;

    vec3 specular = (uSunColor * wetSpecular) + vec3(quartzGlint);
    vec3 lighting = uAmbientColor + (uSunColor * NdotL);

    vec3 finalColor = (diffuseColor * lighting) + specular;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
