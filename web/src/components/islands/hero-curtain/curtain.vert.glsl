// Tul perde: pli + ruzgar + imlec etkisi. Konum tamamen uv'den hesaplanir.
uniform float uTime;
uniform float uOpen;
uniform float uSide;
uniform float uWidth;
uniform float uHeight;
uniform float uWind;
uniform float uPleats;
uniform float uPleatDepth;
uniform vec2 uPointer;
uniform float uPointerStrength;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

#ifdef USE_NOISE
// Simplex 3D noise — Ian McEwan, Ashima Arts / Stefan Gustavson (MIT License)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
#endif

vec3 displace(vec2 st) {
  // ust kenar kornise sabit, etek serbest
  float pin = 1.0 - st.y;
  pin = pin * pin * (3.0 - 2.0 * pin);

  float x = (st.x - 0.5) * uWidth;
  float y = (st.y - 0.5) * uHeight;

  // acilma: kumas dis kenara toplanir, hafifce disari kayar
  float outerX = uSide < 0.0 ? -0.5 * uWidth : 0.5 * uWidth;
  float squeeze = 1.0 - 0.78 * uOpen;
  x = outerX + (x - outerX) * squeeze;
  x += uSide * uOpen * uWidth * 0.14;

  // pli: sabit sayida kivrim; sikistikca derinlesir, asagi dogru hafifce acilir
  float phase = st.x * uPleats * 6.2831853 + 0.35 * sin(st.x * 11.0);
  float pleat = sin(phase) + 0.22 * sin(phase * 2.4 + 1.7);
  float depthTaper = mix(0.78, 1.12, 1.0 - st.y);
  float z = pleat * uPleatDepth * depthTaper * (1.0 + 1.9 * uOpen);

  // ruzgar: yavas ilerleyen dalga (+ yuksek kalitede noise)
  float wave = sin(st.x * 4.2 - uTime * 0.85 + st.y * 1.3) * 0.5
    + sin(st.x * 9.0 + uTime * 0.55) * 0.16;
  #ifdef USE_NOISE
  wave += snoise(vec3(st.x * 2.1, st.y * 1.3 - uTime * 0.07, uTime * 0.11)) * 0.62;
  #endif
  float windAmount = uWind * pin * (1.0 - 0.55 * uOpen);
  z += wave * windAmount;
  x += wave * windAmount * 0.22;
  y += abs(wave) * windAmount * 0.06;

  // imlec: yumusak, sonumlenen tumsek
  vec2 d = (st - uPointer) * vec2(uWidth / uHeight, 1.0);
  z += exp(-dot(d, d) / 0.018) * uPointerStrength * pin * 0.12;

  return vec3(x, y, z);
}

void main() {
  vUv = uv;

  vec3 p = displace(uv);
  const float e = 0.0035;
  vec3 px = displace(uv + vec2(e, 0.0));
  vec3 py = displace(uv + vec2(0.0, e));
  vec3 n = normalize(cross(px - p, py - p));

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vViewPosition = mvPosition.xyz;
  vNormal = normalize(normalMatrix * n);
  gl_Position = projectionMatrix * mvPosition;
}
