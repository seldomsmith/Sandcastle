/**
 * Sandcastle vs. Tide Simulator - Water Surface Shaders
 *
 * Renders fluid layer with vertex collapse, chromatic refraction distortion (Task 1),
 * Night Tide bioluminescent wave foam glow (Task 2), edge foam, and specular highlights.
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
    float b = texture2D(uBedHeightMap, uv).r;
    float h = texture2D(uWaterDepthMap, uv).r;

    vWaterDepth = h;

    float effectiveWaterDepth = h < 0.002 ? 0.0 : h;
    vTotalElevation = b + effectiveWaterDepth;

    vec3 displacedPos = position;
    displacedPos.z = vTotalElevation;

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
  uniform bool uBioluminescent; // Night Tide Bioluminescence flag

  varying vec2 vUv;
  varying float vWaterDepth;
  varying float vTotalElevation;
  varying vec3 vWorldPosition;
  varying vec3 vNormalWS;

  void main() {
    if (vWaterDepth < 0.002) {
      discard;
    }

    vec3 lightDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    float fresnel = pow(1.0 - max(0.0, dot(viewDir, vec3(0.0, 1.0, 0.0))), 3.0);
    fresnel = clamp(fresnel, 0.2, 0.8);

    float depthFactor = clamp(vWaterDepth / 0.30, 0.0, 1.0);
    vec3 waterBase = mix(uWaterColor, uDeepWaterColor, depthFactor);

    // Task 1: Chromatic Refraction Distortion
    vec2 refractionOffset = vec2(sin(vUv.y * 50.0 + uTime * 2.0), cos(vUv.x * 50.0 + uTime * 2.0)) * 0.002;
    vec3 refractionColor = waterBase + vec3(refractionOffset.x * 2.0, refractionOffset.y * 3.0, -refractionOffset.x);
    waterBase = mix(waterBase, refractionColor, 0.4);

    // Shoreline Edge Foam (where depth is shallow < 0.015m)
    float foamLine = 1.0 - smoothstep(0.002, 0.015, vWaterDepth);

    // Turbulent Whitecap Crest Foam Pattern
    float waveFoamPattern = sin(vUv.y * 120.0 - uTime * 4.0) * cos(vUv.x * 80.0);
    float whitecapCrest = smoothstep(0.4, 0.8, waveFoamPattern) * smoothstep(0.005, 0.02, vWaterDepth);

    // Task 2: Night Tide Bioluminescent Glowing Foam
    vec3 foamColor = uBioluminescent ? vec3(0.1, 0.85, 1.0) : vec3(0.96, 0.98, 1.0);
    float totalFoam = clamp(foamLine * 0.75 + whitecapCrest * 0.5, 0.0, 0.95);

    vec3 colorWithFoam = mix(waterBase, foamColor, totalFoam);
    if (uBioluminescent && totalFoam > 0.3) {
      colorWithFoam += vec3(0.0, 0.6, 0.9) * totalFoam * 0.8; // Bioluminescent glow emit
    }

    // Specular Reflection Highlight
    vec3 halfDir = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(vNormalWS, halfDir));
    float specular = pow(NdotH, 64.0) * 0.8;

    vec3 finalColor = colorWithFoam + (uSunColor * specular);
    float alpha = clamp(0.45 + depthFactor * 0.4 + totalFoam * 0.35, 0.25, 0.95);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
