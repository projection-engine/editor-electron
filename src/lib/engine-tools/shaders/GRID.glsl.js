export const vertex = `#version 300 es

layout (location = 0) in vec3 position;
uniform CameraDiscreteMetadata{
    mat4 viewMatrix;
    mat4 projectionMatrix; 
};
out vec3 nearPoint;
out vec3 farPoint;

out mat4 fragView;
out mat4 fragProj;

vec3 unProjectPoint(float x, float y, float z, mat4 view, mat4 projection) {
    mat4 viewInv = inverse(view);
    mat4 projInv = inverse(projection);
    vec4 unProjectedPoint =  viewInv * projInv * vec4(x, y, z, 1.0);
    return unProjectedPoint.xyz / unProjectedPoint.w;
}

void main(){
    
    fragView = viewMatrix;
    fragProj = projectionMatrix; 
    
    nearPoint = unProjectPoint(position.x, position.y, 0.0, viewMatrix, projectionMatrix).xyz;
    farPoint = unProjectPoint(position.x, position.y, 1.0, viewMatrix, projectionMatrix).xyz; 
    gl_Position = vec4(position, 1.0); 
}
`

export const fragment = `#version 300 es
precision mediump float;
 
in vec3 nearPoint;
in vec3 farPoint;

in mat4 fragView;
in mat4 fragProj;
 
uniform vec3 visualSettings; // [gridOpacity, gridSize, showGridSubdivision]
uniform vec4 settings; // [gamma, exposure, far, near]
out vec4 finalColor;


vec4 grid(vec3 fragPos3D, float scale, bool lighter,  vec3 verticalAxisColor, vec3 horizontalAxisColor) {
    vec2 coord = fragPos3D.xz * scale; 
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = min(grid.x, grid.y);
    float minimumz = min(derivative.y, 1.);
    float minimumx = min(derivative.x, 1.);
    float baseColor = visualSettings.x * 0.325;
    vec4 color = vec4(baseColor, baseColor,baseColor, 1.0 - min(lighter ?  line : line - .15, 1.));
    
    float comparison = .3;
  
      
    if(fragPos3D.x > -comparison * minimumx && fragPos3D.x < comparison * minimumx){
        color.rgb = verticalAxisColor;
        color.a = 1.;
    }

    if(fragPos3D.z > -comparison * minimumz && fragPos3D.z < comparison * minimumz){
        color.rgb = horizontalAxisColor;
        color.a = 1.;
        }
    
    return color;
}
float computeDepth(vec3 pos) {
    vec4 clip_space_pos = fragProj * fragView * vec4(pos.xyz, 1.0);
    return (clip_space_pos.z / clip_space_pos.w);
}
float computeLinearDepth(vec3 pos) {
    vec4 clip_space_pos = fragProj * fragView * vec4(pos.xyz, 1.0);
    float clip_space_depth = (clip_space_pos.z / clip_space_pos.w) * 2.0 - 1.0; 
    float linearDepth = (2.0 *  settings.w * 100.) / (100. + settings.w - clip_space_depth * (100. -  settings.w)); 
    return linearDepth / 100.;
}

void main() {
    float t = -nearPoint.y / (farPoint.y - nearPoint.y);
    vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);
    gl_FragDepth = computeDepth(fragPos3D);
    
    float linearDepth = computeLinearDepth(fragPos3D);
    float fading = max(0., (0.5 - abs(linearDepth)));
    vec3 verticalAxisColor = vec3(.0, .0, 10.);
    vec3 horizontalAxisColor = vec3(10., .0, .0);
    
    float size = 1./visualSettings.y;
    finalColor = (
        grid(fragPos3D, size, true,  verticalAxisColor, horizontalAxisColor) +
        (visualSettings.z == 1. ? grid(fragPos3D, size * .5,  false,  verticalAxisColor, horizontalAxisColor) : vec4(0.))
     ) * float(t > 0.);
      
   
    finalColor.rgb = vec3(1.0) - exp(-finalColor.rgb * settings.y * .75);
    finalColor.rgb = pow(finalColor.rgb, vec3(settings.x));
    
    finalColor.a *= fading;
}
`