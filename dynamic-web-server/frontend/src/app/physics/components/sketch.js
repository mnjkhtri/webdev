import { Engine, World, Bodies, Body, Composite, Constraint, Vector, Query } from 'matter-js';

const EnchantedPhysicsPlayground = (p) => {
  // Physics engine setup
  let engine, world;
  let ground, leftWall, rightWall, ceiling;
  let pendulumBall, pendulumConstraint;
  const boxes = [];
  const circles = [];
  const stars = [];
  let windOn = false;
  let gravityOn = true;
  let theme = 'enchanted'; // Default theme
  let particles = [];
  let timeScale = 1;
  let dragBody = null;
  let dragConstraint = null;
  let lastSpawnTime = 0;
  
  // Visual effects
  const colorPalettes = {
    enchanted: {
      background: [25, 10, 50],
      ground: [80, 40, 120],
      pendulum: [180, 100, 240],
      boxes: [240, 180, 100],
      circles: [100, 200, 240],
      stars: [255, 240, 100],
      text: [220, 220, 255]
    },
    cosmic: {
      background: [5, 15, 35],
      ground: [30, 60, 100],
      pendulum: [255, 100, 100],
      boxes: [100, 255, 180],
      circles: [180, 130, 255],
      stars: [255, 255, 150],
      text: [200, 255, 255]
    },
    sunset: {
      background: [25, 10, 15],
      ground: [80, 30, 20],
      pendulum: [255, 150, 50],
      boxes: [255, 100, 80],
      circles: [255, 200, 100],
      stars: [255, 220, 180],
      text: [255, 240, 220]
    }
  };
  
  p.setup = () => {
    p.colorMode(p.RGB);
    p.textFont('Verdana');
    
    // Create engine with improved simulation
    engine = Engine.create({
      enableSleeping: true,
      constraintIterations: 5,
      positionIterations: 8
    });
    world = engine.world;
    engine.gravity.y = 1;

    // Create boundaries with more interesting shapes
    const wallOpts = { isStatic: true, friction: 0.2, restitution: 0.4 };
    ground = Bodies.rectangle(400, 610, 820, 20, { 
      ...wallOpts, 
      chamfer: { radius: 10 },
      render: { fillStyle: '#552288' }
    });
    
    ceiling = Bodies.rectangle(400, -10, 820, 20, wallOpts);
    leftWall = Bodies.rectangle(-10, 300, 20, 620, wallOpts);
    rightWall = Bodies.rectangle(810, 300, 20, 620, wallOpts);
    
    // Add terrain features to make ground more interesting
    const terrainBlocks = [];
    terrainBlocks.push(Bodies.rectangle(100, 580, 100, 30, { 
      ...wallOpts, 
      chamfer: { radius: 8 } 
    }));
    terrainBlocks.push(Bodies.rectangle(700, 580, 120, 30, { 
      ...wallOpts,
      chamfer: { radius: 8 } 
    }));
    terrainBlocks.push(Bodies.polygon(300, 580, 3, 40, wallOpts)); // Triangle
    
    World.add(world, [ground, ceiling, leftWall, rightWall, ...terrainBlocks]);

    // Create a fancy pendulum with a detailed ball
    pendulumBall = Bodies.circle(600, 200, 30, { 
      restitution: 0.9, 
      density: 0.002,
      friction: 0.05,
      frictionAir: 0.001,
      slop: 0.05
    });
    
    pendulumConstraint = Constraint.create({
      pointA: { x: 600, y: 50 },
      bodyB: pendulumBall,
      length: 200,
      stiffness: 0.9,
      damping: 0.01
    });
    
    World.add(world, [pendulumBall, pendulumConstraint]);

    // Create a balanced and artistic initial stack
    const stackHeight = 8;
    for (let i = 0; i < stackHeight; i++) {
      const width = 70 - i * 5;
      boxes.push(
        Bodies.rectangle(200, 560 - i * 30, width, 25, {
          restitution: 0.4 + i * 0.05,
          friction: 0.2,
          density: 0.002,
          frictionAir: 0.001
        })
      );
    }
    World.add(world, boxes);
    
    // Add a few star shapes for visual interest
    for (let i = 0; i < 3; i++) {
      createStar(p.random(100, 700), p.random(100, 300));
    }
  };

  p.draw = () => {
    const palette = colorPalettes[theme];
    
    // Clear with a gradient background
    drawGradientBackground(palette.background);
    
    // Update physics with timeScale
    for (let i = 0; i < timeScale; i++) {
      Engine.update(engine, 1000 / 60 / timeScale);
    }
    
    // Draw magical particles
    updateParticles();
    
    // Draw boundaries with glow effects
    drawBoundaries(palette);
    
    // Draw pendulum with dynamic rope effect
    drawPendulum(palette);
    
    // Draw all objects with enhanced rendering
    drawObjects(palette);
    
    // Apply wind effect with improved visuals
    applyWindEffect();
    
    // UI elements with better styling
    drawUI(palette);
    
    // Handle drag interaction
    handleDragging();
  };
  
  function drawGradientBackground(color) {
    const c1 = p.color(color[0], color[1], color[2]);
    const c2 = p.color(color[0]/2, color[1]/2, color[2]/2);
    
    for (let y = 0; y < p.height; y++) {
      const inter = p.map(y, 0, p.height, 0, 1);
      const c = p.lerpColor(c1, c2, inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }
    
    // Add subtle background sparkles
    if (p.frameCount % 5 === 0) {
      particles.push({
        x: p.random(p.width),
        y: p.random(p.height),
        size: p.random(1, 3),
        life: p.random(20, 40),
        maxLife: p.random(20, 40),
        color: [255, 255, 255, p.random(100, 200)]
      });
    }
  }
  
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      const alpha = p.map(particle.life, 0, particle.maxLife, 0, particle.color[3]);
      p.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
      p.noStroke();
      p.ellipse(particle.x, particle.y, particle.size);
      
      particle.life--;
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }
  
  function drawBoundaries(palette) {
    p.noStroke();
    p.fill(palette.ground[0], palette.ground[1], palette.ground[2]);
    
    // Ground with gradient
    p.beginShape();
    const groundVerts = ground.vertices;
    groundVerts.forEach(v => p.vertex(v.x, v.y));
    p.endShape(p.CLOSE);
    
    // Add some subtle ground texture
    p.fill(palette.ground[0] + 20, palette.ground[1] + 20, palette.ground[2] + 20, 50);
    for (let x = 0; x < p.width; x += 30) {
      p.ellipse(x, 600, p.random(5, 15));
    }
  }
  
  function drawPendulum(palette) {
    // Draw pendulum rope with segments for a chain effect
    const segments = 25;
    const startX = pendulumConstraint.pointA.x;
    const startY = pendulumConstraint.pointA.y;
    const endX = pendulumBall.position.x;
    const endY = pendulumBall.position.y;
    
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const x1 = p.lerp(startX, endX, t1);
      const y1 = p.lerp(startY, endY, t1);
      const x2 = p.lerp(startX, endX, t2);
      const y2 = p.lerp(startY, endY, t2);
      
      // Add slight wave effect to chain
      const offset = p.sin(p.frameCount * 0.1 + i) * 2;
      
      p.stroke(220, 220, 220);
      p.strokeWeight(3);
      p.line(x1 + offset, y1, x2 + offset, y2);
      
      if (i % 2 === 0) {
        p.fill(200);
        p.noStroke();
        p.ellipse(x1 + offset, y1, 8);
      }
    }
    
    // Draw anchor point
    p.fill(150);
    p.stroke(100);
    p.strokeWeight(2);
    p.ellipse(startX, startY, 15);
    
    // Draw pendulum ball with glow effect
    drawGlowingObject(pendulumBall, palette.pendulum, 15);
  }
  
  function drawObjects(palette) {
    // Draw boxes with detail and perspective
    p.noStroke();
    boxes.forEach(box => {
      drawGlowingObject(box, palette.boxes, 5);
    });
    
    // Draw circles with detail
    circles.forEach(circle => {
      drawGlowingObject(circle, palette.circles, 8);
    });
    
    // Draw stars with special effects
    stars.forEach(star => {
      drawGlowingObject(star, palette.stars, 10);
      
      // Add sparkle effect
      if (p.random() < 0.2) {
        const pos = star.position;
        particles.push({
          x: pos.x + p.random(-20, 20),
          y: pos.y + p.random(-20, 20),
          size: p.random(2, 5),
          life: p.random(10, 20),
          maxLife: p.random(10, 20),
          color: [...palette.stars, 150]
        });
      }
    });
  }
  
  function drawGlowingObject(body, color, glowSize) {
    // Draw glow effect
    p.fill(color[0], color[1], color[2], 50);
    p.noStroke();
    
    if (body.circleRadius) {
      p.ellipse(body.position.x, body.position.y, body.circleRadius * 2 + glowSize);
    } else {
      p.beginShape();
      const expandedVerts = body.vertices.map(v => {
        const dx = v.x - body.position.x;
        const dy = v.y - body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        return {
          x: body.position.x + Math.cos(angle) * (dist + glowSize/2),
          y: body.position.y + Math.sin(angle) * (dist + glowSize/2)
        };
      });
      expandedVerts.forEach(v => p.vertex(v.x, v.y));
      p.endShape(p.CLOSE);
    }
    
    // Draw the actual object
    p.fill(color[0], color[1], color[2]);
    if (body.circleRadius) {
      p.ellipse(body.position.x, body.position.y, body.circleRadius * 2);
      
      // Add details to circles
      p.fill(color[0] + 30, color[1] + 30, color[2] + 30);
      p.ellipse(
        body.position.x - body.circleRadius * 0.3, 
        body.position.y - body.circleRadius * 0.3, 
        body.circleRadius * 0.7
      );
    } else {
      p.beginShape();
      body.vertices.forEach(v => p.vertex(v.x, v.y));
      p.endShape(p.CLOSE);
      
      // Add details to polygons
      if (body.vertices.length > 2) {
        p.fill(color[0] + 30, color[1] + 30, color[2] + 30);
        p.beginShape();
        const centroid = body.position;
        body.vertices.forEach(v => {
          const midX = (v.x + centroid.x) / 2;
          const midY = (v.y + centroid.y) / 2;
          p.vertex(midX, midY);
        });
        p.endShape(p.CLOSE);
      }
    }
  }
  
  function applyWindEffect() {
    if (windOn) {
      // Create wind particles
      if (p.frameCount % 3 === 0) {
        particles.push({
          x: -10,
          y: p.random(p.height),
          size: p.random(1, 4),
          life: p.random(50, 100),
          maxLife: p.random(50, 100),
          vx: p.random(2, 5),
          vy: p.random(-0.5, 0.5),
          color: [255, 255, 255, p.random(50, 100)]
        });
      }
      
      // Update wind particles
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].vx) {
          particles[i].x += particles[i].vx;
          particles[i].y += particles[i].vy;
        }
      }
      
      // Apply force to physics bodies
      const wind = Vector.create(0.001, 0);
      Composite.allBodies(world).forEach(body => {
        if (!body.isStatic) {
          const scaledWind = Vector.mult(wind, body.area * 0.001);
          Body.applyForce(body, body.position, scaledWind);
        }
      });
    }
  }
  
  function drawUI(palette) {
    // Draw UI panel with semi-transparent background
    p.fill(20, 20, 40, 200);
    p.rect(10, 10, 435, 80, 10);
    
    p.fill(palette.text[0], palette.text[1], palette.text[2]);
    p.textSize(14);
    p.text("Click to spawn shapes. Hold and drag to interact.", 20, 35);
    p.text("W: Toggle wind | G: Toggle gravity | T: Change theme", 20, 55);
    p.text("S: Spawn star | P: Play/Pause | R: Reset scene", 20, 75);
    
    // Display current physics status
    let statusText = "";
    if (!gravityOn) statusText += "Zero-G ";
    if (windOn) statusText += "Windy ";
    if (timeScale === 0) statusText += "Paused ";
    if (statusText) {
      p.textAlign(p.RIGHT);
      p.text(statusText, p.width - 20, 30);
      p.textAlign(p.LEFT);
    }
  }
  
  function handleDragging() {
    if (dragBody && dragConstraint) {
      const pos = dragBody.position;
      p.stroke(255, 100);
      p.strokeWeight(2);
      p.line(dragConstraint.pointA.x, dragConstraint.pointA.y, pos.x, pos.y);
    }
  }
  
  function createStar(x, y) {
    const starRadius = p.random(15, 25);
    const points = 5;
    const outerRadius = starRadius;
    const innerRadius = starRadius * 0.4;
    const vertices = [];
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * 2 * i) / (points * 2);
      vertices.push({
        x: x + radius * Math.cos(angle),
        y: y + radius * Math.sin(angle)
      });
    }
    
    const star = Bodies.fromVertices(x, y, [vertices], {
      restitution: 0.7,
      friction: 0.1,
      density: 0.001,
      frictionAir: 0.002
    });
    
    stars.push(star);
    World.add(world, star);
    
    // Add a burst of particles
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: x + p.random(-20, 20),
        y: y + p.random(-20, 20),
        size: p.random(2, 6),
        life: p.random(10, 30),
        maxLife: p.random(10, 30),
        color: [255, 255, 150, p.random(100, 200)]
      });
    }
    
    return star;
  }
  
  function spawnRandomShape(x, y, forceMultiplier = 1) {
    const now = Date.now();
    if (now - lastSpawnTime < 100) return; // Prevent too frequent spawns
    lastSpawnTime = now;
    
    const r = p.random();
    let body;
    
    if (r < 0.4) {
      // Box with random rotation
      const size = p.random(20, 60);
      body = Bodies.rectangle(x, y, size, size * p.random(0.6, 1.5), {
        restitution: 0.5,
        friction: 0.3,
        density: 0.001,
        frictionAir: 0.001,
        angle: p.random(Math.PI * 2)
      });
      boxes.push(body);
    } else if (r < 0.8) {
      // Circle
      body = Bodies.circle(x, y, p.random(10, 30), {
        restitution: 0.7,
        friction: 0.1,
        density: 0.001,
        frictionAir: 0.001
      });
      circles.push(body);
    } else {
      // Sometimes create a polygon
      const sides = Math.floor(p.random(3, 7));
      body = Bodies.polygon(x, y, sides, p.random(15, 30), {
        restitution: 0.6,
        friction: 0.2,
        density: 0.001,
        frictionAir: 0.001
      });
      boxes.push(body);
    }
    
    World.add(world, body);
    
    // Apply random impulse
    const force = {
      x: p.random(-0.03, 0.03) * forceMultiplier,
      y: p.random(-0.05, 0) * forceMultiplier
    };
    Body.applyForce(body, body.position, force);
    
    return body;
  }
  
  function resetScene() {
    // Remove all non-static bodies
    Composite.allBodies(world).forEach(body => {
      if (!body.isStatic && body !== pendulumBall) {
        World.remove(world, body);
      }
    });
    
    // Clear arrays
    boxes.length = 0;
    circles.length = 0;
    stars.length = 0;
    
    // Create a new stack
    const stackHeight = 8;
    for (let i = 0; i < stackHeight; i++) {
      const width = 70 - i * 5;
      const box = Bodies.rectangle(200, 560 - i * 30, width, 25, {
        restitution: 0.4 + i * 0.05,
        friction: 0.2,
        density: 0.002,
        frictionAir: 0.001
      });
      boxes.push(box);
      World.add(world, box);
    }
    
    // Reset pendulum
    Body.setPosition(pendulumBall, { x: 600, y: 200 });
    Body.setVelocity(pendulumBall, { x: 0, y: 0 });
    Body.setAngularVelocity(pendulumBall, 0);
    
    // Add some stars
    for (let i = 0; i < 3; i++) {
      createStar(p.random(100, 700), p.random(100, 300));
    }
  }
  
  function cyclePalette() {
    const themes = Object.keys(colorPalettes);
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    theme = themes[nextIndex];
  }
  
  p.mousePressed = () => {
    // Check if mouse is over any body
    const bodies = Query.point(Composite.allBodies(world), { x: p.mouseX, y: p.mouseY });
    
    if (bodies.length > 0) {
      // If we clicked on a body, grab it
      dragBody = bodies[0];
      dragConstraint = Constraint.create({
        pointA: { x: p.mouseX, y: p.mouseY },
        bodyB: dragBody,
        stiffness: 0.2,
        damping: 0.1
      });
      World.add(world, dragConstraint);
    } else {
      // Otherwise spawn a new shape
      spawnRandomShape(p.mouseX, p.mouseY);
    }
    
    // Give pendulum a nudge if we're near it
    const d = p.dist(p.mouseX, p.mouseY, pendulumBall.position.x, pendulumBall.position.y);
    if (d < 100) {
      Body.applyForce(pendulumBall, pendulumBall.position, { 
        x: p.random(-0.05, 0.05), 
        y: p.random(-0.05, 0.05) 
      });
    }
  };
  
  p.mouseDragged = () => {
    if (dragConstraint) {
      dragConstraint.pointA = { x: p.mouseX, y: p.mouseY };
    }
  };
  
  p.mouseReleased = () => {
    if (dragConstraint) {
      World.remove(world, dragConstraint);
      dragConstraint = null;
      dragBody = null;
    }
  };
  
  p.keyPressed = () => {
    if (p.key === 'W' || p.key === 'w') {
      windOn = !windOn;
    }
    if (p.key === 'G' || p.key === 'g') {
      gravityOn = !gravityOn;
      engine.gravity.y = gravityOn ? 1 : 0;
    }
    if (p.key === 'T' || p.key === 't') {
      cyclePalette();
    }
    if (p.key === 'S' || p.key === 's') {
      createStar(p.mouseX || p.width/2, p.mouseY || p.height/2);
    }
    if (p.key === 'P' || p.key === 'p') {
      timeScale = timeScale === 0 ? 1 : 0;
    }
    if (p.key === 'R' || p.key === 'r') {
      resetScene();
    }
    // Space key creates an explosion
    if (p.key === ' ') {
      const explosionCenter = { x: p.mouseX || p.width/2, y: p.mouseY || p.height/2 };
      const explosionRadius = 150;
      const explosionForce = 0.2;
      
      // Create explosion particles
      for (let i = 0; i < 30; i++) {
        const angle = p.random(Math.PI * 2);
        const dist = p.random(explosionRadius);
        particles.push({
          x: explosionCenter.x + Math.cos(angle) * p.random(10),
          y: explosionCenter.y + Math.sin(angle) * p.random(10),
          size: p.random(3, 8),
          life: p.random(20, 50),
          maxLife: p.random(20, 50),
          vx: Math.cos(angle) * p.random(1, 8),
          vy: Math.sin(angle) * p.random(1, 8),
          color: [255, p.random(150, 255), p.random(50, 150), p.random(150, 255)]
        });
      }
      
      // Apply force to nearby bodies
      Composite.allBodies(world).forEach(body => {
        if (!body.isStatic) {
          const dx = body.position.x - explosionCenter.x;
          const dy = body.position.y - explosionCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < explosionRadius) {
            const angle = Math.atan2(dy, dx);
            const force = (1 - distance / explosionRadius) * explosionForce;
            Body.applyForce(body, body.position, {
              x: Math.cos(angle) * force,
              y: Math.sin(angle) * force
            });
          }
        }
      });
      
      // Spawn a few shapes from explosion
      for (let i = 0; i < 5; i++) {
        const angle = p.random(Math.PI * 2);
        const dist = p.random(20, 40);
        const x = explosionCenter.x + Math.cos(angle) * dist;
        const y = explosionCenter.y + Math.sin(angle) * dist;
        spawnRandomShape(x, y, 3);
      }
    }
  };
};

export default EnchantedPhysicsPlayground;