function createCylinder(radius, height, segments) {
    const vertices = [];
    const indices = [];
    const angleStep = (2 * Math.PI) / segments;
  
    // Generate vertices
    for (let i = 0; i <= segments; ++i) {
      const angle = i * angleStep;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
  
      // Top circle
      vertices.push(x, height / 2, z);
      // Bottom circle
      vertices.push(x, -height / 2, z);
    }
  
    // Generate indices
    for (let i = 0; i < segments; ++i) {
      const top1 = 2 * i;
      const bottom1 = 2 * i + 1;
      const top2 = 2 * (i + 1);
      const bottom2 = 2 * (i + 1) + 1;
  
      // Top circle
      indices.push(top1, top2, bottom1);
      // Bottom circle
      indices.push(bottom1, top2, bottom2);
    }
  
    return { vertices, indices };
  }
  
class Cylinder {
    constructor(radius, height, segments) {
      const { vertices, indices } = createCylinder(radius, height, segments);
      this.vertices = vertices;
      this.indices = indices;
      this.color = [1.0, 1.0, 1.0, 1.0]; // Default color: white
      this.matrix = new Matrix4();
    }
  
    render() {
      // Bind the vertex buffer
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
  
      const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      // Bind the index buffer
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
  
      // Set the color
      const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
      gl.uniform4fv(u_FragColor, this.color);
  
      // Set the transformation matrix
      const u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      // Draw the cylinder
      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }