/**
 * Sandcastle vs. Tide Simulator - Water Surface Shaders
 *
 * Renders fluid layer with foam lines along shallow sand edges,
 * velocity-based UV advection distortions, specular highlights, and depth transparency.
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

    vWaterDepth = depth;
    vTotalElevation = bed + depth;

    // Displace vertex to total water surface height (b + h)
    vec3 displacedPos = position + vec3(0.0, 0.0, vTotalElevation);
    vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
    vWorldPosition = worldPos.xyz;

    vNormalWS = normalMatrix * vec3(0.0, 0.0, 1.0); // Upward water surface normal

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
    // Discard rendering dry regions where water depth is below threshold
    if (vWaterDepth < 0.0005) {
      discard;
    }

    vec3 lightDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Fresnel Reflection Term
    float fresnel = pow(1.0 - max(0.0, dot(viewDir, vec3(0.0, 1.0, 0.0))), 3.0);
    fresnel = clamp(fresnel, 0.2, 0.8);

    // Color gradient based on water column depth
    float depthFactor = clamp(vWaterDepth / 0.3, 0.0, 1.0);
    vec3 waterBase = mix(uWaterColor, uDeepWaterColor, depthFactor);

    // Shoreline Edge Foam (where depth is shallow < 0.02m)
    float foamLine = 1.0 - smoothstep(0.001, 0.025, vWaterDepth);
    vec3 foamColor = vec3(0.95, 0.98, 1.0);
    vec3 colorWithFoam = mix(waterBase, foamColor, foamLine * 0.7);

    // Specular Reflection Highlight
    vec3 halfDir = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(vNormalWS, halfDir));
    float specular = pow(NdotH, 64.0) * 0.8;

    vec3 finalColor = colorWithFoam + (uSunColor * specular);
    float alpha = clamp(0.4 + depthFactor * 0.45 + foamLine * 0.3, 0.2, 0.9);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
