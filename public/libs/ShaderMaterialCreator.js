import * as THREE from 'three';

export default class ShaderMaterialCreator {
  constructor() {
    this.shaderMaterial = null;
  }

  setShaderMaterial() {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      uniform float time;
      void main() {
        vec2 p = -1.0 + 2.0 * vUv;
        float a = time * 40.0;
        float d, e, f, g = 1.0 / 40.0 ,h ,i ,r ,q;
        e = 400.0 * ( p.x * 0.5 + 0.5 );
        f = 400.0 * ( p.y * 0.5 + 0.5 );
        i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;
        d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g / 2.0 ) * 18.0;
        r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );
        q = f / r;
        e = ( r * cos( q ) ) - a / 2.0;
        f = ( r * sin( q ) ) - a / 2.0;
        d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;
        h = ( ( f + d ) + a / 2.0 ) * g;
        i = cos( h + r * p.x / 1.3 ) * cos( h + r * p.y / 1.3 ) * cos( h + r * p.x / 1.3 ) * cos( h + r * p.y / 1.3 );
        h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;
        h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 + h ) * g;
        h = h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 + h;
        d = a * sin( i ) * sin( i ) * 20.0 + sin( f * g ) * 2.0 + cos( e * g ) * 2.0;
        r = ( ( d + a / 2.0 ) * g + cos( r * h / 6.0 ) * 100.0 + cos( q * h / 3.0 ) * 88.0 ) * g;
        float c = mod( time / 60.0, 1.0 );
        vec3 color = mix( vec3( r * 0.01, q * r * 0.1, h * r * 0.1 ), vec3( d * r * r / 3.5, r * r * q, r * h ), c );
        gl_FragColor = vec4( color * cos( d + r ), 1.0 );
      }
    `;

    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          value: 0.0
        }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });
  }
}