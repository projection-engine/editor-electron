layout (location = 0) in vec3 position;
//import(cameraUBO)

uniform mat4 transformMatrix;

void main(){              
    gl_Position = viewProjection * transformMatrix * vec4(position, 1.0);
}