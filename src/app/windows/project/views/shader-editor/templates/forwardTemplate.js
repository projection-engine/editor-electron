export default {
    static: `#version 300 es
  
precision highp float;
#define MAX_POINT_LIGHTS 24
#define MAX_LIGHTS 2
#define PI  3.14159265359 

in vec4 vPosition;
in  vec2 texCoord;
in mat3 toTangentSpace;
uniform int directionalLightsQuantity;
uniform mat3 directionalLightsData[MAX_LIGHTS];
uniform vec3 cameraVec;
uniform mat4 pointLightData[MAX_POINT_LIGHTS];
uniform int lightQuantity;

in vec3 normalVec;
in mat4 normalMatrix; 
in vec3 viewDirection;  
uniform float elapsedTime;
uniform int shadingModel;
@import(ambientUniforms)

uniform sampler2D sceneColor;

// OUTPUTS
out vec4 finalColor;
        `,
    wrapper: (body, ambient) => `


${ambient ? `
@import(fresnelSchlickRoughness)
@import(forwardAmbient)
` : ""}
 
  
@import(fresnelSchlick)
@import(geometrySchlickGGX)
@import(distributionGGX)
@import(geometrySmith)
@import(computeDirectionalLight) 
@import(computePointLight)



void main(){
    ${body}
    vec3 fragPosition = vPosition.xyz;  
    vec3 albedo = vec3(gAlbedo);
    if(shadingModel != -1 && albedo.r <= 1. && albedo.g <= 1. && albedo.b <= 1.){       
        float roughness = gBehaviour.g;
        float metallic = gBehaviour.b;
        float ao = gBehaviour.r;
        vec3 N = vec3(gNormal); 
        
        
        vec3 V = normalize(cameraVec - fragPosition);
        float NdotV    = max(dot(N, V), 0.000001);
        vec3 F0 = vec3(0.04);
        vec3 Lo = vec3(0.0);
        F0 = mix(F0, albedo, metallic);
        
         for (int i = 0; i < directionalLightsQuantity; i++){
                vec3 lightDir =  normalize(vec3(directionalLightsData[i][0][0], directionalLightsData[i][0][1],directionalLightsData[i][0][2]));
                vec3 lightColor =  vec3(directionalLightsData[i][1][0], directionalLightsData[i][1][1],directionalLightsData[i][1][2]);    
                Lo += computeDirectionalLight(
                    V,
                    F0,
                    lightDir,
                    lightColor,
                    fragPosition,
                    roughness,
                    metallic,
                    N,
                    albedo
                );
        }
     
        for (int i = 0; i < lightQuantity; ++i){
            vec4 currentLightData = computePointLights(pointLightData[i],  fragPosition, V, N, 1., roughness, metallic, albedo, F0, i);
            Lo += currentLightData.rgb;    
        }
    
       ${ambient ? `
        Lo += computeAmbient(NdotV, metallic, roughness, albedo, F0, V, N, ambientLODSamples, brdfSampler, vPosition.rgb);
        ` : ""}
    
        finalColor = vec4(Lo, opacity);
    }
    else
       finalColor = vec4(albedo, opacity);        
}
        `,
    inputs: "",
    functions: ""
}

export const vertex = (bodyOperations, inputs, functions) => {
    return `#version 300 es
#define MAX_LIGHTS 2
#define PI  3.14159265359 

layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat3 normalMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraVec; 



out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec;  
 
${inputs}
${functions}
 

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize( normalMatrix  * normalize(tangentVec));
    vec3 N =  normalize(normalMatrix * normal);
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(normalMatrix * biTangent);
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);

    texCoord = uvTexture;
    gl_Position = vPosition;

    ${bodyOperations}
    
    gl_Position *= projectionMatrix * viewMatrix; 
}
`
}