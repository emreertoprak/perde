// Tul golgelendirme: katlarda opaklasan, arkadan isik alan yari saydam kumas.
uniform vec3 uColor;
uniform vec3 uLightDir;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(-vViewPosition);

  float facing = clamp(abs(dot(n, v)), 0.0, 1.0);
  float grazing = pow(1.0 - facing, 1.6);

  float diffuse = 0.64 + 0.36 * max(dot(n, normalize(uLightDir)), 0.0);
  vec3 color = uColor * diffuse;
  color += vec3(1.0, 0.975, 0.93) * grazing * 0.2;

  float hem = smoothstep(0.03, 0.0, vUv.y);
  float alpha = uOpacity * (0.58 + 0.42 * grazing) + hem * 0.22;

  float edge = smoothstep(0.0, 0.015, vUv.x) * smoothstep(1.0, 0.985, vUv.x);
  alpha = clamp(alpha * edge, 0.0, 1.0);

  gl_FragColor = vec4(color * alpha, alpha);
}
