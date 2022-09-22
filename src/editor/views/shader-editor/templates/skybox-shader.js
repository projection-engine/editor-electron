export default {
    static: `#version 300 es
    
precision highp float;
// IN
#define PI  3.14159265359 

in vec4 vPosition;
in  vec2 texCoord;
in mat3 toTangentSpace;
uniform vec3 cameraVec;
in vec3 normalVec;
in mat4 normalMatrix; 
in vec3 viewDirection;  
uniform float elapsedTime;
  

// OUTPUTS
out vec4 finalColor;
        `,
    wrapper: (body) => `

void main(){
    ${body}
     vec3 albedo = vec3(gAlbedo);
    finalColor = vec4(albedo, 1.);
}
        `,
    inputs: "",
    functions: ""
}

export const vertexSkybox = `
#version 300 es
layout (location = 0) in vec3 position;
layout (location = 2) in vec2 uvTexture;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec2 texCoord;

void main(){
    texCoord = uvTexture;
    
    mat4 m = viewMatrix;
   m[3][0]  = 0.0;
   m[3][1]  = 0.0;
   m[3][2]  = 0.0;
    gl_Position = projectionMatrix * m * vec4(position, 1.0);
}
`