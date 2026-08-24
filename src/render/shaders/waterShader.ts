/**
 * Sandcastle vs. Tide Simulator - Water Surface Shaders
 *
 * Renders fluid layer with foam lines along shallow sand edges,
 * wave crest whitecaps, specular highlights, and depth transparency.
 */

export const waterVertexShader = /* glsl */ `
  uniform sampler2D uWaterDepthMap;
  uniform sampler2D uBedHeightMap;
  uniform float uGridResolution;

  varying vec2 vUv;
  varying float vWaterDepth;
  varying float vTotalElevation;
  varying vec3 vWorldPosition;
  varying vec3 vNormalWS;

  void main() {
    vUv = uv;
    float depth = texture2D(uWaterDepthMap, uv).r;
    float bed = texture2D(uBedHeightMap, uv).r;

    // Clamp water depth to paper-thin coastal swash sheet (3cm max depth above sand)
    float clampedDepth = clamp(depth, 0.0, 0.035);

    vWaterDepth = clampedDepth;
    vTotalElevation = bed + clampedDepth;

    // Displace vertex smoothly to total water surface height
    vec3 displacedPos = position + vec3(0.0, 0.0, vTotalElevation);
    vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
    vWorldPosition = worldPos.xyz;

    vNormalWS = normalMatrix * vec3(0.0, 0.0, 1.0);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const waterFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uWaterColor;
  uniform vec3 uDeepWaterColor;
  uniform float uTime;

  varying vec2 vUv;
  varying float vWaterDepth;
  varying float vTotalElevation;
  varying vec3 vWorldPosition;
  varying vec3 vNormalWS;

  void main() {
    if (vWaterDepth < 0.0005) {
      discard;
    }

    vec3 lightDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    float fresnel = pow(1.0 - max(0.0, dot(viewDir, vec3(0.0, 1.0, 0.0))), 3.0);
    fresnel = clamp(fresnel, 0.2, 0.8);

    float depthFactor = clamp(vWaterDepth / 0.035, 0.0, 1.0);
    vec3 waterBase = mix(uWaterColor, uDeepWaterColor, depthFactor);

    // Shoreline Edge Foam (where depth is shallow < 0.015m)
    float foamLine = 1.0 - smoothstep(0.001, 0.015, vWaterDepth);

    // Turbulent Whitecap Crest Foam Pattern
    float waveFoamPattern = sin(vUv.y * 120.0 - uTime * 4.0) * cos(vUv.x * 80.0);
    float whitecapCrest = smoothstep(0.4, 0.8, waveFoamPattern) * smoothstep(0.005, 0.02, vWaterDepth);

    vec3 foamColor = vec3(0.96, 0.98, 1.0);
    float totalFoam = clamp(foamLine * 0.75 + whitecapCrest * 0.5, 0.0, 0.95);

    vec3 colorWithFoam = mix(waterBase, foamColor, totalFoam);

    // Specular Reflection Highlight
    vec3 halfDir = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(vNormalWS, halfDir));
    float specular = pow(NdotH, 64.0) * 0.8;

    vec3 finalColor = colorWithFoam + (uSunColor * specular);
    float alpha = clamp(0.45 + depthFactor * 0.4 + totalFoam * 0.35, 0.25, 0.95);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
