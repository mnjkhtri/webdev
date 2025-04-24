import p5 from 'p5'

const HomeSketch = (p) => {
  let TIME; // 0-24 hour format, representing time of day
  let soil, houses = [], sun, moon, stars = [], clouds = [], shootingStars = [];
  let skyColorZenith, skyColorHorizon;
  let birds = [];
  let fireflies = [];
  let flowers = [];
  let trees = [];
  let grassBlades = [];
  let raindrops = [];
  let weatherState = "clear"; // clear, rainy
  let weatherTimer = 0;
  let rainbow = null; // Object to store rainbow properties
  let lightning = null; // Object to store lightning properties
  let lightningTimer = 0;
  let chimneySmokeParticles = [];

  // --- Time Constants ---
  const SUNRISE_START = 5.0; // Start of sunrise transition
  const SUNRISE_PEAK = 6.5; // Sun fully risen, sky brightens
  const DAY_START = 8.0; // Full daylight
  const SUNSET_START = 17.0; // Start of sunset transition
  const SUNSET_PEAK = 18.5; // Sun setting, sky reddens
  const NIGHT_START = 20.0; // Full night, stars appear
  const NIGHT_END = 5.0; // Night ends, pre-sunrise starts

  // --- Scene Constants ---
  const NUM_STARS = 200;
  const NUM_CLOUDS = 8;
  const NUM_BIRDS = 12;
  const NUM_FLOWERS = 30;
  const NUM_TREES = 4;
  const NUM_GRASS = 200;
  const MAX_CLOUD_SIZE_FACTOR = 0.18; // Relative to width
  const MIN_CLOUD_SIZE_FACTOR = 0.08; // Relative to width

  // --- Color Palette ---
  // Defined as functions to avoid p5 color object issues before setup
  const Colors = {
    DeepNightZenith: () => p.color(5, 5, 30),
    DeepNightHorizon: () => p.color(15, 15, 60),
    SunriseZenith: () => p.color(70, 90, 180),
    SunriseHorizon: () => p.color(255, 150, 90),
    DayZenith: () => p.color(110, 200, 255),
    DayHorizon: () => p.color(190, 225, 255),
    SunsetZenith: () => p.color(90, 90, 170),
    SunsetHorizon: () => p.color(255, 120, 85),
    HouseBase: () => p.color(p.random(180, 210), p.random(160, 190), p.random(140, 170)),
    HouseRoof: () => p.color(p.random(80, 130), p.random(50, 80), p.random(10, 30)),
    WindowDay: () => p.color(170, 215, 230, 200),
    WindowNight: () => p.color(255, 220, 130, 230),
    WindowPane: () => p.color(50, 50, 50, 100),
    Door: () => p.color(p.random(120, 160), p.random(70, 100), p.random(30, 60)),
    Chimney: () => p.color(110, 110, 110),
    Soil: () => p.color(110, 80, 50),
    Sun: () => p.color(255, 220, 0),
    SunGlow: () => p.color(255, 180, 0, 60), // Lower alpha for glow
    Moon: () => p.color(240, 240, 250),
    MoonGlow: () => p.color(210, 210, 230, 50), // Lower alpha for glow
    Flower: () => p.color(p.random([255, 240, 220, 200, 180, 150]), p.random([130, 150, 180, 220, 255]), p.random([100, 130, 160, 180, 220, 255])),
    FlowerCenter: () => p.color(p.random(220, 255), p.random(180, 220), p.random(0, 80)),
    TreeTrunk: () => p.color(p.random(80, 120), p.random(50, 80), p.random(20, 50)),
    TreeLeaves: () => p.color(p.random(30, 100), p.random(100, 180), p.random(20, 80)),
    BirdColor: () => p.color(p.random(30, 100), p.random(30, 100), p.random(30, 100)),
    RainbowColors: [
      p.color(255, 0, 0, 150), // Red
      p.color(255, 127, 0, 150), // Orange
      p.color(255, 255, 0, 150), // Yellow
      p.color(0, 255, 0, 150), // Green
      p.color(0, 0, 255, 150), // Blue
      p.color(75, 0, 130, 150), // Indigo
      p.color(143, 0, 255, 150) // Violet
    ],
    Lightning: () => p.color(255, 255, 255, p.random(200, 255)),
    Grass: () => p.color(p.random(40, 100), p.random(120, 180), p.random(40, 80)),
    CloudColorDay: () => p.color(255, 255, 255, p.random(180, 230)),
    CloudColorNight: () => p.color(150, 150, 170, p.random(160, 210)),
    CloudColorRain: () => p.color(120, 120, 140, p.random(200, 240)),
    RainDrop: () => p.color(180, 200, 230, 180),
    // Removed Snowflake color
    Smoke: () => p.color(200, 200, 200, p.random(50, 150)),
  };

  // --- Utility Functions ---
  const lerpColor = (c1, c2, amt) => {
    amt = p.constrain(amt, 0, 1);
    // Ensure colors are p5.Color objects before lerping
    const p5c1 = p.color(c1);
    const p5c2 = p.color(c2);
    return p.lerpColor(p5c1, p5c2, amt);
  };

  // Smooth mapping function using cosine interpolation
  const smoothMap = (value, start1, stop1, start2, stop2) => {
    const range1 = stop1 - start1;
    const range2 = stop2 - start2;
    if (range1 === 0) return start2; // Avoid division by zero
    const amt = p.constrain((value - start1) / range1, 0, 1);
    // Apply easing (smooth step)
    const easedAmt = (1 - p.cos(amt * p.PI)) / 2;
    return start2 + easedAmt * range2;
  };

  // Maps time, handling the wrap-around midnight (24 -> 0)
  const mapTimeWrapped = (currentTime, startTime, endTime) => {
    let duration = (endTime >= startTime) ? endTime - startTime : (24 - startTime) + endTime;
    let elapsed;

    if (startTime <= endTime) { // Normal case (e.g., 8am to 5pm)
      if (currentTime >= startTime && currentTime < endTime) {
        elapsed = currentTime - startTime;
      } else {
        return (currentTime < startTime) ? 0 : 1; // Outside the range
      }
    } else { // Wrap-around case (e.g., 8pm to 5am)
      if (currentTime >= startTime || currentTime < endTime) {
        elapsed = (currentTime >= startTime) ? currentTime - startTime : (24 - startTime) + currentTime;
      } else {
        return 0; // Before the range starts
      }
    }

    return p.constrain(elapsed / duration, 0, 1);
  };

  function getNightIntensity() {
    if (TIME >= SUNSET_PEAK && TIME < NIGHT_START) {
      return smoothMap(TIME, SUNSET_PEAK, NIGHT_START, 0, 1);

    } else if (TIME >= NIGHT_START || TIME < NIGHT_END - 1.0) {
      return 1.0;

    } else if (TIME >= NIGHT_END - 1.0 && TIME < NIGHT_END) {
       return smoothMap(TIME, NIGHT_END - 1.0, NIGHT_END, 1, 0);
    } else {
      return 0;
    }
  }

  // --- Class Definitions ---

  class Soil {
    constructor(soilLevel) {
      this.y = soilLevel;
      this.color = Colors.Soil();
      this.patches = [];

      // Create random soil patches for texture
      for (let i = 0; i < 30; i++) {
        this.patches.push({
          x: p.random(p.width),
          y: p.random(this.y, p.height),
          size: p.random(10, 50),
          color: p.color(
            p.red(this.color) + p.random(-20, 10),
            p.green(this.color) + p.random(-20, 10),
            p.blue(this.color) + p.random(-20, 10)
          )
        });
      }
    }

    draw() {
      p.fill(this.color);
      p.noStroke();
      p.rect(0, this.y, p.width, p.height - this.y);

      // Draw texture patches
      p.fill(100,70,40, 80); // Slightly darker patch color
      for (let patch of this.patches) {
        //p.fill(patch.color);
        p.ellipse(patch.x, patch.y, patch.size, patch.size * 0.6);
      }

      // Add a slightly darker line at the top for definition
      p.strokeWeight(1);
      p.stroke(p.red(this.color) * 0.8, p.green(this.color) * 0.8, p.blue(this.color) * 0.8);
      p.line(0, this.y, p.width, this.y);
      p.noStroke();
    }

    getSoilHeight() { return this.y; }
  }

  class House {
    constructor(fromLeft, houseWidth, houseHeight, soil) {
      this.houseWidth = houseWidth;
      this.houseHeight = houseHeight;
      this.soilHeight = soil.getSoilHeight();
      this.houseCorner = p.createVector(fromLeft, this.soilHeight - this.houseHeight);
      this.roofColor = Colors.HouseRoof();
      this.baseColor = Colors.HouseBase();
      this.windowColorDay = Colors.WindowDay();
      this.windowColorNight = Colors.WindowNight();
      this.windowPaneColor = Colors.WindowPane();
      this.doorColor = Colors.Door();
      this.chimneyColor = Colors.Chimney();
      this.hasChimney = p.random() > 0.3;
      this.smokeActive = this.hasChimney && p.random() > 0.3;
      this.windowsLit = p.random() > 0.5; // Start some lights on/off randomly
      this.windowLightIntensity = this.windowsLit ? 1 : 0;
      this.style = p.floor(p.random(3)); // Different house styles
    }

    update() {
      const isNight = TIME < SUNRISE_PEAK || TIME >= SUNSET_PEAK;
      const targetIntensity = isNight ? 1 : 0;

      // Smooth transition for window lights - random chance to turn on/off at night/day
      if (isNight && !this.windowsLit && p.random() < 0.005) {
          this.windowsLit = true;
      } else if (!isNight && this.windowsLit && p.random() < 0.01) {
          this.windowsLit = false;
      }

      this.windowLightIntensity = p.lerp(this.windowLightIntensity, this.windowsLit ? targetIntensity : 0, 0.05);

      // Generate chimney smoke only if active, at night/morning, and not raining heavily
      // Removed snowy check
      if (this.smokeActive && (isNight || TIME < DAY_START) && weatherState !== "rainy" && p.frameCount % 10 === 0) {
        const roofHeight = this.houseWidth * 0.4;
        let chimneyTopY = -roofHeight * 0.6 - this.houseHeight * 0.3; // Adjust based on style if needed
         if (this.style === 2) {
             chimneyTopY = -roofHeight * 0.9;
         }

        chimneySmokeParticles.push(new ChimneySmokeParticle(
          this.houseCorner.x + this.houseWidth * 0.7 + this.houseWidth * 0.05, // Center of chimney
          this.houseCorner.y + chimneyTopY, // Top of chimney
          p.random(5, 15),
          p.random(-0.2, 0.2), // vx
          p.random(-0.8, -0.3) // vy
        ));
      }
    }

    draw() {
      this.update();

      p.push();
      p.translate(this.houseCorner.x, this.houseCorner.y);
      p.noStroke();

      // Base:
      p.fill(this.baseColor);

      if (this.style === 0) { // Standard house
        p.rect(0, 0, this.houseWidth, this.houseHeight);
      } else if (this.style === 1) { // House with rounded top corners
        p.rect(0, 0, this.houseWidth, this.houseHeight, 10, 10, 0, 0);
      } else { // House with slightly tapered bottom
        p.quad(
          -this.houseWidth * 0.05, this.houseHeight,
          this.houseWidth * 1.05, this.houseHeight,
          this.houseWidth, 0,
          0, 0
        );
      }

      // Roof details based on style
      const roofHeight = this.houseWidth * 0.4;
      const overhang = this.houseWidth * 0.12;
      p.fill(this.roofColor);

      if (this.style === 0 || this.style === 1) { // Standard gable roof
        p.triangle(
          -overhang, 0,
          this.houseWidth + overhang, 0,
          this.houseWidth / 2, -roofHeight
        );
      } else { // Hipped roof
        p.quad(
          -overhang, 0,
          this.houseWidth + overhang, 0,
          this.houseWidth * 0.9, -roofHeight * 0.8,
          this.houseWidth * 0.1, -roofHeight * 0.8
        );
        // Roof peak (less pronounced for hip)
        p.fill(p.red(this.roofColor)*0.9, p.green(this.roofColor)*0.9, p.blue(this.roofColor)*0.9);
        p.triangle(
          this.houseWidth * 0.1, -roofHeight * 0.8,
          this.houseWidth * 0.9, -roofHeight * 0.8,
          this.houseWidth / 2, -roofHeight * 0.95 // Slightly lower peak
        );
        p.fill(this.roofColor); // Reset fill
      }

      // Chimney
      if (this.hasChimney) {
        const chimneyWidth = this.houseWidth * 0.1;
        const chimneyHeight = this.houseHeight * 0.3;
        let chimneyX = this.houseWidth * 0.7;
        let chimneyY = -roofHeight * 0.6; // Default Y

        if (this.style === 2) { // Position on the sloped roof for hipped style
           // Calculate position based on roof slope
           let roofAngle = p.atan2(roofHeight * 0.8, this.houseWidth * 0.4); // Angle of the hip slope
           chimneyX = this.houseWidth * 0.8; // Move further along roof
           chimneyY = -p.tan(roofAngle) * (this.houseWidth - chimneyX); // Calculate Y pos on slope
        }

        p.fill(this.chimneyColor);
        // Draw chimney base slightly embedded in roof
        p.rect(chimneyX, chimneyY, chimneyWidth, chimneyHeight);

        // Chimney cap
        let chimneyCapY = chimneyY - chimneyHeight;
        p.fill(p.red(this.chimneyColor)*0.8, p.green(this.chimneyColor)*0.8, p.blue(this.chimneyColor)*0.8);
        p.rect(chimneyX - chimneyWidth*0.075, chimneyCapY, chimneyWidth * 1.15, chimneyWidth * 0.4);
      }


      // Door:
      const doorWidth = this.houseWidth * 0.25;
      const doorHeight = this.houseHeight * 0.55;
      p.fill(this.doorColor);
      p.rect(this.houseWidth * 0.15, this.houseHeight - doorHeight, doorWidth, doorHeight, 4, 4, 0, 0);

      // Door details (knob)
      p.fill(p.red(this.doorColor)*0.8, p.green(this.doorColor)*0.8, p.blue(this.doorColor)*0.8);
      p.ellipse(this.houseWidth * 0.15 + doorWidth * 0.8, this.houseHeight - doorHeight * 0.5, doorWidth * 0.1, doorWidth * 0.1);

      // Door frame
      p.noFill();
      p.stroke(p.red(this.doorColor) * 0.7, p.green(this.doorColor) * 0.7, p.blue(this.doorColor) * 0.7);
      p.strokeWeight(2);
      p.rect(this.houseWidth * 0.15 + 1, this.houseHeight - doorHeight + 1, doorWidth - 2, doorHeight - 1, 4, 4, 0, 0);
      p.noStroke();


      // Windows
      let windowColor = lerpColor(this.windowColorDay, this.windowColorNight, this.windowLightIntensity);
      p.fill(windowColor);

      let winWidth = this.houseWidth * 0.2;
      let winHeight = this.houseHeight * 0.25;
      let winY = this.houseHeight * 0.2;
      let winX1 = this.houseWidth * 0.55;

      // Main window
      p.rect(winX1, winY, winWidth, winHeight, 4);

      // Window Panes
      if (this.windowLightIntensity > 0.1) {
        // Brighter panes for lit window
        p.stroke(255, 255, 220, 100 + 100 * this.windowLightIntensity); // Brighter when more lit
      } else {
        p.stroke(this.windowPaneColor);
      }
      p.strokeWeight(1);
      // Horizontal pane
      p.line(winX1, winY + winHeight / 2, winX1 + winWidth, winY + winHeight / 2);
      // Vertical pane
      p.line(winX1 + winWidth / 2, winY, winX1 + winWidth / 2, winY + winHeight);

      // Window sill
      p.noStroke();
      p.fill(p.red(this.baseColor)*0.85, p.green(this.baseColor)*0.85, p.blue(this.baseColor)*0.85);
      p.rect(winX1 - 3, winY + winHeight, winWidth + 6, winHeight * 0.1);

      p.pop();
    }
  }

  // Calculate celestial body position on screen based on time
  function calculateScreenPath(time, startTime, endTime, horizonY, peakY) {
    let progress = mapTimeWrapped(time, startTime, endTime);
    // Map progress to an arc path across the screen
    let x = p.map(progress, 0, 1, -sun.size, p.width + sun.size); // Use sun size for offset
    // Use sin for smooth arc, map [0, PI] to [horizon, peak, horizon]
    let y = horizonY - (horizonY - peakY) * p.sin(progress * p.PI);
    return { x, y };
  }


  class Sun {
    constructor(size) {
      this.size = size;
      this.color = Colors.Sun();
      this.glowColor = Colors.SunGlow();
      this.x = -size; // Initial position off-screen
      this.y = p.height;
      this.rays = [];

      // Generate sun rays properties
      for (let i = 0; i < 12; i++) {
        this.rays.push({
          angle: i * p.TWO_PI / 12,
          length: p.random(size * 0.8, size * 1.4),
          width: p.random(2, 5),
          speed: p.random(0.001, 0.003) // Rotation speed
        });
      }
    }

    update(horizonY) {
      const peakY = p.height * 0.1; // Highest point the sun reaches
      const path = calculateScreenPath(TIME, SUNRISE_START, NIGHT_START, horizonY, peakY);
      this.x = path.x;
      this.y = path.y;

      // Update ray animation (slow rotation)
      for (let ray of this.rays) {
        ray.angle += ray.speed;
      }
    }

    draw(horizonY) {
      // Only draw if sun is above the horizon
      if (this.y < horizonY + this.size / 2) {
        this.update(horizonY);

        // Calculate sun intensity based on time of day for color/glow adjustments
        let intensity = 1.0;
        if (TIME < DAY_START) { // Sunrise
          intensity = smoothMap(TIME, SUNRISE_START, DAY_START, 0.5, 1.0);
        } else if (TIME > SUNSET_START) { // Sunset
          intensity = smoothMap(TIME, SUNSET_START, NIGHT_START, 1.0, 0.5);
        }
        intensity = p.constrain(intensity, 0.5, 1.0); // Keep some brightness

        // Draw dynamic rays during peak daylight
        if (TIME > SUNRISE_PEAK && TIME < SUNSET_PEAK) {
          p.push();
          p.translate(this.x, this.y);
          // Use the glow color for rays, adjust alpha with intensity
          let rayAlpha = p.alpha(this.glowColor) * intensity * 1.5; // Make rays brighter
          p.stroke(p.red(this.glowColor), p.green(this.glowColor), p.blue(this.glowColor), rayAlpha);

          for (let ray of this.rays) {
            p.strokeWeight(ray.width);
            // Make ray length pulsate slightly
            let rayLength = ray.length * (0.9 + 0.1 * p.sin(p.frameCount * 0.02 + ray.angle));
            p.line(0, 0,
                   p.cos(ray.angle) * rayLength,
                   p.sin(ray.angle) * rayLength);
          }
          p.pop();
        }

        // Draw Glow layers
        p.noFill();
        for (let i = 0; i < 3; i++) {
          // Alpha decreases and size increases for outer glow rings
          let alpha = p.map(i, 0, 3, 60, 10) * intensity;
          let sizeMult = p.map(i, 0, 3, 1.2, 2.2);
          p.strokeWeight(this.size * 0.8 / (i + 2)); // Thinner outer rings
          p.stroke(p.red(this.glowColor), p.green(this.glowColor), p.blue(this.glowColor), alpha);
          p.ellipse(this.x, this.y, this.size * sizeMult);
        }

        // Draw Sun Body with color adjusted by intensity
        let sunBodyColor = p.color(
          p.red(this.color),
          p.green(this.color) * intensity, // Less green/blue during sunrise/sunset
          p.blue(this.color) * (intensity * 0.8)
        );

        // Create radial gradient for sun body (center brighter)
        p.noStroke();
        for (let r = this.size / 2; r > 0; r -= 2) {
          let gradientAmt = p.map(r, 0, this.size / 2, 0.3, 0); // Map radius to lerp amount (0=center, 0.3=edge)
          let gradientColor = lerpColor(sunBodyColor, p.color(255, 255, 200), gradientAmt); // Lerp towards white at center
          p.fill(gradientColor);
          p.ellipse(this.x, this.y, r * 2);
        }
      }
    }
  }

  class Moon {
    constructor(size) {
      this.size = size * 0.9; // Slightly smaller than sun
      this.color = Colors.Moon();
      this.glowColor = Colors.MoonGlow();
      this.x = -size; // Initial position off-screen
      this.y = p.height;

      // Generate craters
      this.craters = [];
      let numCraters = p.floor(p.random(4, 8));
      for (let i = 0; i < numCraters; i++) {
        let angle = p.random(p.TWO_PI);
        let dist = p.random(0, 0.7) * this.size / 2; // Random distance from center
        this.craters.push({
          x: p.cos(angle) * dist, // Position based on angle/dist
          y: p.sin(angle) * dist,
          size: p.random(this.size * 0.05, this.size * 0.15), // Size relative to moon
          shade: p.random(0.7, 0.9) // Darkness factor
        });
      }
    }

    update(horizonY) {
      const peakY = p.height * 0.15; // Moon peak slightly lower than sun
      const path = calculateScreenPath(TIME, NIGHT_START, SUNRISE_START, horizonY, peakY);
      this.x = path.x;
      this.y = path.y;
    }

    draw(horizonY) {
      // Draw moon during night and transitions
      if (TIME < DAY_START || TIME >= SUNSET_START) {
        this.update(horizonY);

        // Only draw if moon is above the horizon
        if (this.y < horizonY + this.size / 2) {

          // Calculate moon visibility/alpha based on transitions
          let moonAlpha = 255;
          const fadeDuration = 1.5; // Hours for fade in/out
          if (TIME > SUNRISE_START - fadeDuration && TIME < SUNRISE_START + fadeDuration) {
            moonAlpha = smoothMap(TIME, SUNRISE_START - fadeDuration, SUNRISE_START + fadeDuration, 255, 0); // Fade out at sunrise
          } else if (TIME > SUNSET_START - fadeDuration && TIME < SUNSET_START + fadeDuration) {
             moonAlpha = smoothMap(TIME, SUNSET_START - fadeDuration, SUNSET_START + fadeDuration, 0, 255); // Fade in at sunset
          } else if (TIME < SUNRISE_START - fadeDuration && TIME > SUNSET_START + fadeDuration) {
             moonAlpha = 255; // Fully visible at night
          } else {
               moonAlpha = 0; // Not visible during day
          }
          moonAlpha = p.constrain(moonAlpha, 0, 255);


          if (moonAlpha > 0) {
            // Draw Glow
            p.noFill();
            for (let i = 0; i < 3; i++) {
              let alpha = p.map(i, 0, 3, 50, 10) * (moonAlpha / 255);
              let sizeMult = p.map(i, 0, 3, 1.3, 2.5);
              p.strokeWeight(this.size * 0.4 / (i + 1));
              p.stroke(p.red(this.glowColor), p.green(this.glowColor), p.blue(this.glowColor), alpha);
              p.ellipse(this.x, this.y, this.size * sizeMult);
            }

            p.push();
            p.translate(this.x, this.y);

            // Draw Moon Body
            p.noStroke();
            p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), moonAlpha);
            p.ellipse(0, 0, this.size);

            // Draw craters before the phase shadow
             let craterAlpha = moonAlpha * 0.8; // Craters slightly less opaque
             for (let crater of this.craters) {
               // Crater shadow (slightly offset)
               p.fill(180, 180, 210, craterAlpha * 0.5); // Darker, lower alpha shadow
               p.ellipse(crater.x + 1, crater.y + 1, crater.size * 1.1); // Slightly larger shadow

               // Crater
               p.fill(p.red(this.color) * crater.shade,
                      p.green(this.color) * crater.shade,
                      p.blue(this.color) * crater.shade,
                      craterAlpha);
               p.ellipse(crater.x, crater.y, crater.size);
             }

            p.pop();
          }
        }
      }
    }
  }

  class Star {
    constructor(x, y, size) {
      this.x = x;
      this.y = y;
      this.baseSize = size;
      this.twinkleFactor = p.random(0.6, 1.4); // How much it twinkles
      this.twinkleSpeed = p.random(0.02, 0.08);
      this.currentSize = 0;
      this.alpha = 0;
      this.maxAlpha = p.random(180, 255);
      this.color = p.color(255, 255, p.random(230, 255)); // Mostly white, slightly yellow/blue tint
      this.starType = p.random() > 0.9 ? "special" : "normal"; // 10% chance of special star
    }

    update() {
      const nightIntensity = getNightIntensity();

      if (nightIntensity > 0.1) {
        // Use sine wave for twinkling effect
        let twinkle = p.sin(p.frameCount * this.twinkleSpeed + this.x * 0.1); // Offset based on position
        // Modulate size and alpha based on twinkle and night intensity
        this.currentSize = this.baseSize * (1 + twinkle * 0.3 * this.twinkleFactor);
        this.alpha = p.map(twinkle, -1, 1, this.maxAlpha * 0.5, this.maxAlpha) * nightIntensity * nightIntensity; // Fade in faster as night deepens
        this.alpha = p.constrain(this.alpha, 0, 255);
      } else {
        // Fade out quickly when night ends
        this.alpha = p.max(0, this.alpha - 15);
      }
    }

    draw() {
      this.update(); // Update state before drawing
      if (this.alpha > 1) { // Only draw if visible
        p.noStroke();

        if (this.starType === "special" && this.currentSize > 1.5) { // Draw special star only if large enough
          p.push();
          p.translate(this.x, this.y);

          // Star glow (softer, larger ellipse)
          p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), this.alpha * 0.2);
          p.ellipse(0, 0, this.currentSize * 4);

          // Star points (4-pointed star shape)
           p.rotate(p.frameCount * 0.005); // Slow rotation
          p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), this.alpha);
           let outerRad = this.currentSize * 1.8;
           let innerRad = this.currentSize * 0.8;
           let numPoints = 4;
           p.beginShape();
           for(let i = 0; i < numPoints * 2; i++) {
              let radius = (i % 2 === 0) ? outerRad : innerRad;
              let angle = p.map(i, 0, numPoints * 2, 0, p.TWO_PI) - p.HALF_PI;
              p.vertex(p.cos(angle) * radius, p.sin(angle) * radius);
           }
           p.endShape(p.CLOSE);

          p.pop();
        } else { // Normal star (simple ellipse)
          p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), this.alpha);
          p.ellipse(this.x, this.y, this.currentSize, this.currentSize);
        }
      }
    }
  }

 class ShootingStar {
    constructor() {
      this.reset();
      this.active = false;
      this.activateTimer = p.random(300, 1000); // Frames until it might appear
    }

    reset() {
      this.x = p.random(p.width * 0.1, p.width * 0.9);
      this.y = p.random(p.height * 0.05, p.height * 0.2);
      this.len = p.random(80, 150);
      this.angle = p.random(p.PI * 0.1, p.PI * 0.4); // Downward angle
      this.vx = p.cos(this.angle) * p.random(15, 25);
      this.vy = p.sin(this.angle) * p.random(15, 25);
      this.alpha = 255;
      this.maxLife = p.random(20, 40); // Frames it lasts
      this.life = this.maxLife;
    }

    update() {
       const nightIntensity = getNightIntensity();

       if (!this.active) {
          this.activateTimer--;
          if (this.activateTimer <= 0 && nightIntensity > 0.8 && p.random() < 0.002) {
             this.active = true;
             this.reset();
          }
          return; // Don't update position if inactive
       }


      this.x += this.vx;
      this.y += this.vy;
      this.life--;

      // Fade out as it dies
      this.alpha = p.map(this.life, 0, this.maxLife, 0, 255);

      // Reset if life ends or goes off screen
      if (this.life <= 0 || this.y > p.height * 0.8) {
        this.active = false;
        this.activateTimer = p.random(500, 1500); // Reset activation timer
      }
    }

    draw() {
       if (!this.active || this.alpha <= 0) return; // Don't draw if inactive or faded

       p.push();
       p.strokeWeight(p.map(this.life, 0, this.maxLife, 0.5, 2.5)); // Thinner tail
       p.stroke(255, 255, 230, this.alpha);

       // Draw line representing the shooting star trail
       let tailX = this.x - p.cos(this.angle) * this.len * (this.alpha / 255); // Tail shortens as it fades
       let tailY = this.y - p.sin(this.angle) * this.len * (this.alpha / 255);
       p.line(this.x, this.y, tailX, tailY);

       // Draw a brighter head
       p.fill(255, 255, 255, this.alpha);
       p.noStroke();
       p.ellipse(this.x, this.y, 4, 4);
       p.pop();
    }
  }

  class Cloud {
    constructor(yPos, sizeFactor) {
      this.x = p.random(-p.width * 0.3, p.width * 1.3); // Start some off-screen
      this.y = yPos;
      this.baseWidth = p.width * sizeFactor;
      this.height = this.baseWidth * p.random(0.3, 0.6);
      this.speed = p.random(0.1, 0.5) * (p.random() > 0.5 ? 1 : -1); // Random speed and direction
      this.colorDay = Colors.CloudColorDay();
      this.colorNight = Colors.CloudColorNight();
      this.colorRain = Colors.CloudColorRain();
      this.numPuffs = p.floor(p.random(5, 10));
      this.puffs = [];
      this.noiseOffsetX = p.random(1000);
      this.noiseOffsetY = p.random(1000);

      // Create cloud puffs
      for (let i = 0; i < this.numPuffs; i++) {
        this.puffs.push({
          offsetX: p.random(-this.baseWidth * 0.4, this.baseWidth * 0.4),
          offsetY: p.random(-this.height * 0.3, this.height * 0.3),
          radius: p.random(this.height * 0.5, this.height * 1.2),
          noiseFactor: p.random(0.5, 1.5) // How much this puff morphs
        });
      }
    }

    update() {
      this.x += this.speed;

      // Wrap around screen edges
      if (this.speed > 0 && this.x - this.baseWidth / 2 > p.width) {
        this.x = -this.baseWidth / 2;
      } else if (this.speed < 0 && this.x + this.baseWidth / 2 < 0) {
        this.x = p.width + this.baseWidth / 2;
      }

       // Morph puffs using Perlin noise
        let timeFactor = p.frameCount * 0.005;
        for(let puff of this.puffs) {
            let noiseVal = p.noise(this.noiseOffsetX + puff.offsetX * 0.01 + timeFactor,
                                   this.noiseOffsetY + puff.offsetY * 0.01);
            puff.currentRadius = puff.radius * (0.8 + noiseVal * 0.4 * puff.noiseFactor); // Modulate radius
        }
    }

    draw() {
      this.update();

      // Determine cloud color based on time and weather
      let cloudColor;
      const nightIntensity = getNightIntensity();
      // Removed snowy check
      if (weatherState === "rainy") {
         let rainMix = p.constrain(weatherTimer / 100, 0, 1); // Mix based on how long it's been raining
         let baseColor = lerpColor(this.colorDay, this.colorNight, nightIntensity);
         cloudColor = lerpColor(baseColor, this.colorRain, rainMix);
      } else {
         cloudColor = lerpColor(this.colorDay, this.colorNight, nightIntensity);
      }


      p.push();
      p.translate(this.x, this.y);
      p.noStroke();

      // Draw base ellipse for smoother bottom edge
      p.fill(p.red(cloudColor), p.green(cloudColor), p.blue(cloudColor), p.alpha(cloudColor) * 0.8); // Slightly more transparent base
      p.ellipse(0, this.height * 0.2, this.baseWidth * 0.9, this.height * 0.7);

      // Draw the morphing puffs
      p.fill(cloudColor);
      for (let puff of this.puffs) {
        p.ellipse(puff.offsetX, puff.offsetY, puff.currentRadius, puff.currentRadius * 0.9); // Slightly oval puffs
      }

      p.pop();
    }
  }


  class Bird {
    constructor(yPos, soilY) {
       this.pos = p.createVector(p.random(-50, p.width + 50), yPos + p.random(-p.height * 0.1, p.height * 0.1));
       this.vel = p5.Vector.random2D().mult(p.random(1, 3)); // Initial random velocity
       this.acc = p.createVector(0, 0);
       this.maxSpeed = p.random(2, 4);
       this.maxForce = p.random(0.05, 0.15); // Steering force limit
       this.color = Colors.BirdColor();
       this.wingAngle = 0;
       this.wingSpeed = p.random(0.2, 0.5);
       this.target = null; // Potential target (like mouse pointer)
       this.soilY = soilY;
       this.state = "flying"; // flying, landing, landed, taking_off
       this.landTimer = 0;
    }

    // --- Boid Flocking Behavior ---
    applyForce(force) {
       this.acc.add(force);
    }

    // Separation: Steer to avoid crowding local flockmates
    separate(boids) {
       let desiredSeparation = 25.0;
       let steer = p.createVector(0, 0);
       let count = 0;
       for (let other of boids) {
          let d = p5.Vector.dist(this.pos, other.pos);
          if ((d > 0) && (d < desiredSeparation)) {
             // Calculate vector pointing away from neighbor
             let diff = p5.Vector.sub(this.pos, other.pos);
             diff.normalize();
             diff.div(d); // Weight by distance
             steer.add(diff);
             count++;
          }
       }
       if (count > 0) {
          steer.div(count);
       }
       if (steer.mag() > 0) {
          steer.normalize();
          steer.mult(this.maxSpeed);
          steer.sub(this.vel);
          steer.limit(this.maxForce * 1.5); // Stronger separation force
       }
       return steer;
    }

    // Alignment: Steer towards the average heading of local flockmates
    align(boids) {
       let neighborDist = 50;
       let sum = p.createVector(0, 0);
       let count = 0;
       for (let other of boids) {
          let d = p5.Vector.dist(this.pos, other.pos);
          if ((d > 0) && (d < neighborDist)) {
             sum.add(other.vel);
             count++;
          }
       }
       if (count > 0) {
          sum.div(count);
          sum.normalize();
          sum.mult(this.maxSpeed);
          let steer = p5.Vector.sub(sum, this.vel);
          steer.limit(this.maxForce);
          return steer;
       } else {
          return p.createVector(0, 0);
       }
    }

    // Cohesion: Steer to move towards the average position of local flockmates
    cohesion(boids) {
       let neighborDist = 60;
       let sum = p.createVector(0, 0);
       let count = 0;
       for (let other of boids) {
          let d = p5.Vector.dist(this.pos, other.pos);
          if ((d > 0) && (d < neighborDist)) {
             sum.add(other.pos);
             count++;
          }
       }
       if (count > 0) {
          sum.div(count);
          return this.seek(sum);
       } else {
          return p.createVector(0, 0);
       }
    }

    // Seek: Steer towards a target position
    seek(target) {
       let desired = p5.Vector.sub(target, this.pos);
       desired.normalize();
       desired.mult(this.maxSpeed);
       let steer = p5.Vector.sub(desired, this.vel);
       steer.limit(this.maxForce);
       return steer;
    }

    // --- Update Logic ---
    update(flock) {
       // Flocking behavior only applies during flight
       if (this.state === "flying" || this.state === "taking_off") {
          let sep = this.separate(flock);
          let ali = this.align(flock);
          let coh = this.cohesion(flock);

          // Arbitrarily weight these forces
          sep.mult(1.8);
          ali.mult(1.0);
          coh.mult(1.0);

          this.applyForce(sep);
          this.applyForce(ali);
          this.applyForce(coh);

            // Add a gentle pull towards the center if birds stray too far
          let center = p.createVector(p.width / 2, p.height * 0.3);
          let distToCenter = p5.Vector.dist(this.pos, center);
          if (distToCenter > p.width * 0.6) {
             this.applyForce(this.seek(center).mult(0.5));
          }

             // Avoid ground when flying
          if (this.pos.y > this.soilY - 20) {
              let desired = p.createVector(this.vel.x, -this.maxSpeed); // Go up
              let steer = p5.Vector.sub(desired, this.vel);
              steer.limit(this.maxForce * 2.0); // Strong avoidance
              this.applyForce(steer);
          }


          this.vel.add(this.acc);
          this.vel.limit(this.maxSpeed);
          this.pos.add(this.vel);
          this.acc.mult(0); // Reset acceleration

             // Wing flapping animation
             this.wingAngle += this.wingSpeed;

             // Random chance to land during the day
             if (TIME > SUNRISE_PEAK && TIME < SUNSET_START && p.random() < 0.0005) {
                this.state = "landing";
                this.target = p.createVector(p.random(p.width * 0.1, p.width * 0.9), this.soilY - 5); // Target just above ground
             }

       } else if (this.state === "landing") {
            let steer = this.seek(this.target);
            this.applyForce(steer);
            // Slow down when approaching target
            let distance = p5.Vector.dist(this.pos, this.target);
            if (distance < 50) {
                let mappedSpeed = p.map(distance, 0, 50, 0.5, this.maxSpeed);
                this.vel.limit(mappedSpeed);
            } else {
                this.vel.limit(this.maxSpeed);
            }

            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);

            // Check if landed
            if (distance < 5) {
                this.state = "landed";
                this.pos.y = this.soilY - 2; // Snap to ground
                this.vel.mult(0);
                this.landTimer = p.random(100, 300); // How long to stay landed
            }
            this.wingAngle += this.wingSpeed * 0.5; // Slower flapping when landing


       } else if (this.state === "landed") {
          this.landTimer--;
            this.wingAngle = 0; // Wings folded when landed
          if (this.landTimer <= 0) {
             this.state = "taking_off";
             this.acc.add(p.createVector(p.random(-1,1), p.random(-1.5, -0.8)).mult(0.5)); // Jump up
          }
       }

       // Wrap around screen edges (only when flying)
       if (this.state === "flying") {
          if (this.pos.x < -10) this.pos.x = p.width + 10;
          if (this.pos.x > p.width + 10) this.pos.x = -10;
          // Keep birds vertically constrained mostly
          if (this.pos.y < p.height * 0.05) this.pos.y = p.height * 0.05;
          // if (this.pos.y > p.height * 0.6) this.pos.y = p.height * 0.6; // Don't let them fly too low unless landing
       }

       // Reset state if taking off and high enough
       if (this.state === "taking_off" && this.pos.y < this.soilY - 30) {
          this.state = "flying";
       }
    }

    draw() {
      // Only draw birds during the day
      if (TIME < SUNRISE_START || TIME > SUNSET_PEAK) return;

      p.push();
      p.translate(this.pos.x, this.pos.y);
      p.noStroke();
      p.fill(this.color);

      if (this.state === "landed") {
          // Simple standing bird shape
          p.ellipse(0, 0, 5, 7); // Body
          p.ellipse(0, -4, 3, 3); // Head
          p.stroke(50);
          p.strokeWeight(1);
          p.line(0, 3, -1, 5); // Leg 1
          p.line(0, 3, 1, 5); // Leg 2
      } else {
          // Flying bird shape (simple 'M')
          p.rotate(this.vel.heading() + p.HALF_PI); // Point in direction of velocity
          let wingY = p.sin(this.wingAngle) * 3; // Wing flap amount
          p.beginShape();
          p.vertex(0, -6); // Head/Body center
          p.vertex(-5, wingY); // Left wing tip
          p.vertex(0, -2); // Body center point
          p.vertex(5, wingY); // Right wing tip
          p.vertex(0, -6); // Back to head/body center
          p.endShape(p.CLOSE);
      }


      p.pop();
    }
  }

  class Flower {
     constructor(x, y) {
        this.x = x;
        this.y = y;
        this.stemHeight = p.random(15, 40);
        this.petalColor = Colors.Flower();
        this.centerColor = Colors.FlowerCenter();
        this.petalSize = p.random(4, 8);
        this.numPetals = p.floor(p.random(5, 8));
        this.angleOffset = p.random(p.TWO_PI);
        this.swaySpeed = p.random(0.01, 0.03);
        this.swayAmount = p.random(0.05, 0.15);
      }

      draw(soilY) {
        p.push();
        p.translate(this.x, soilY); // Start drawing from soil level

        // Swaying stem
        let sway = p.sin(p.frameCount * this.swaySpeed + this.x * 0.1) * this.swayAmount;
        let stemTopX = sway * this.stemHeight; // Horizontal sway increases with height
        let stemTopY = -this.stemHeight;

        // Stem
        p.stroke(30, 100, 30); // Green stem
        p.strokeWeight(1.5);
        p.line(0, 0, stemTopX, stemTopY); // Line from base to swaying top

        // Flower head at stem top
        p.translate(stemTopX, stemTopY);
        p.noStroke();

        // Petals
        p.fill(this.petalColor);
        for (let i = 0; i < this.numPetals; i++) {
            let angle = this.angleOffset + i * p.TWO_PI / this.numPetals;
            let px = p.cos(angle) * this.petalSize * 0.7;
            let py = p.sin(angle) * this.petalSize * 0.7;
            p.ellipse(px, py, this.petalSize, this.petalSize * 0.8); // Slightly oval petals
        }

        // Center
        p.fill(this.centerColor);
        p.ellipse(0, 0, this.petalSize * 0.8, this.petalSize * 0.8);

        p.pop();
      }
  }

  class Tree {
     constructor(x, soilY) {
        this.x = x;
        this.soilY = soilY;
        this.trunkWidth = p.random(p.width * 0.015, p.width * 0.03);
        this.trunkHeight = p.random(p.height * 0.1, p.height * 0.25);
        this.trunkColor = Colors.TreeTrunk();
        this.leavesColor = Colors.TreeLeaves();
        this.crownWidth = this.trunkWidth * p.random(4, 7);
        this.crownHeight = this.trunkHeight * p.random(1.2, 2.0);
        this.noiseOffsetX = p.random(1000); // For leaf cluster variation
        this.leafClusters = [];
        let numClusters = p.floor(p.random(5, 10));

        // Generate leaf cluster positions relative to the top of the trunk
        for (let i = 0; i < numClusters; i++) {
            this.leafClusters.push({
               offsetX: p.random(-this.crownWidth * 0.4, this.crownWidth * 0.4),
               offsetY: p.random(-this.crownHeight * 0.5, this.crownHeight * 0.1), // Mostly above trunk top
               radius: p.random(this.crownWidth * 0.2, this.crownWidth * 0.5)
            });
        }
      }

      draw() {
        p.push();
        p.translate(this.x, this.soilY); // Position base at soil level

        // Trunk
        p.fill(this.trunkColor);
        p.noStroke();
        // Simple rectangle trunk, wider at base
        p.quad(
            -this.trunkWidth * 0.6, 0, // Bottom left
            this.trunkWidth * 0.6, 0, // Bottom right
            this.trunkWidth * 0.4, -this.trunkHeight, // Top right
            -this.trunkWidth * 0.4, -this.trunkHeight // Top left
        );

        // Crown - draw multiple overlapping ellipses for a fuller look
        p.translate(0, -this.trunkHeight); // Move origin to top of trunk
        let timeFactor = p.frameCount * 0.01;

        for (let cluster of this.leafClusters) {
             // Slightly modulate color and size for texture
             let noiseVal = p.noise(this.noiseOffsetX + cluster.offsetX * 0.02 + timeFactor, cluster.offsetY * 0.02);
             let r = p.red(this.leavesColor) * (0.9 + noiseVal * 0.2);
             let g = p.green(this.leavesColor) * (0.9 + noiseVal * 0.2);
             let b = p.blue(this.leavesColor) * (0.9 + noiseVal * 0.2);
             let radius = cluster.radius * (0.9 + noiseVal * 0.2);

             p.fill(r, g, b, 220); // Slightly transparent leaves
             p.ellipse(cluster.offsetX, cluster.offsetY, radius, radius * 0.8);
        }

        p.pop();
      }
  }

  class GrassBlade {
     constructor(x, soilY) {
        this.x = x;
        this.soilY = soilY;
        this.height = p.random(5, 15);
        this.angle = p.random(-p.PI / 16, p.PI / 16); // Initial slight bend
        this.color = Colors.Grass();
        this.thickness = p.random(1, 2.5);
        this.swaySpeed = p.random(0.02, 0.05);
        this.swayAmount = p.random(p.PI / 32, p.PI / 16);
      }

      draw() {
        p.push();
        p.translate(this.x, this.soilY);
        p.stroke(this.color);
        p.strokeWeight(this.thickness);

        // Calculate sway based on sine wave
        let sway = p.sin(p.frameCount * this.swaySpeed + this.x * 0.05) * this.swayAmount;
        let currentAngle = this.angle + sway;

        // Draw the blade as a line
        let tipX = p.cos(currentAngle - p.HALF_PI) * this.height;
        let tipY = p.sin(currentAngle - p.HALF_PI) * this.height;
        p.line(0, 0, tipX, tipY);

        p.pop();
      }
  }

 class Raindrop {
    constructor(x, y) {
       this.pos = p.createVector(x, y);
       this.vel = p.createVector(p.random(-0.5, 0.5), p.random(5, 10)); // Mostly downward, slight angle
       this.len = p.random(5, 15);
       this.alpha = p.random(150, 200);
       this.color = Colors.RainDrop();
    }

    update(soilY) {
       this.pos.add(this.vel);
       // Gradually fade near ground (optional, can look messy)
       // this.alpha = p.map(this.pos.y, soilY - 50, soilY, 180, 0);
    }

    draw() {
       p.stroke(p.red(this.color), p.green(this.color), p.blue(this.color), this.alpha);
       p.strokeWeight(1);
       p.line(this.pos.x, this.pos.y, this.pos.x - this.vel.x * 0.5, this.pos.y - this.len); // Draw line slanted slightly against velocity
    }

    isOffScreen(soilY) {
       return this.pos.y > soilY;
    }
 }

 // Removed Snowflake class

 class Rainbow {
    constructor() {
       this.active = false;
       this.alpha = 0;
       this.maxAlpha = 150; // Set in Colors.RainbowColors alpha
       this.radius = p.width * 0.7; // Initial large radius
       this.centerX = p.width / 2;
       this.centerY = p.height; // Base the arc near the bottom
       this.thickness = p.height * 0.03;
       this.colors = Colors.RainbowColors;
       this.fadeSpeed = 1.5;
    }

    show() {
       this.active = true;
    }

    hide() {
       this.active = false;
    }

    update() {
       if (this.active && this.alpha < this.maxAlpha) {
          this.alpha = p.min(this.maxAlpha, this.alpha + this.fadeSpeed);
       } else if (!this.active && this.alpha > 0) {
          this.alpha = p.max(0, this.alpha - this.fadeSpeed);
       }
    }

    draw() {
       if (this.alpha <= 0) return;

       p.push();
       p.noFill();
       p.strokeWeight(this.thickness);
       let currentRadius = this.radius;

       for (let i = 0; i < this.colors.length; i++) {
          let c = this.colors[i];
          p.stroke(p.red(c), p.green(c), p.blue(c), this.alpha); // Use calculated alpha
          // Draw arc from PI to TWO_PI (bottom half circle)
          p.arc(this.centerX, this.centerY, currentRadius * 2, currentRadius * 2, p.PI, p.TWO_PI);
          currentRadius -= this.thickness; // Move inwards for next color band
       }
       p.pop();
    }
 }

 class Lightning {
    constructor() {
       this.active = false;
       this.alpha = 0;
       this.maxAlpha = 200;
       this.flashDuration = p.random(3, 8); // Frames the flash lasts
       this.timer = 0;
       this.segments = [];
       this.color = Colors.Lightning();
       this.startY = 0;
       this.endY = p.height * p.random(0.5, 0.8); // Doesn't always reach ground
       this.startX = p.random(p.width * 0.2, p.width * 0.8);
    }

    flash() {
       this.active = true;
       this.alpha = this.maxAlpha;
       this.timer = this.flashDuration;
       this.segments = []; // Recalculate segments each flash
       this.color = Colors.Lightning(); // Get new random brightness
       this.startX = p.random(p.width * 0.1, p.width * 0.9);
       this.endY = p.height * p.random(0.5, 0.8) + p.random(50); // Vary end point

       // Create lightning bolt segments using recursion or iteration
       this.createBolt(this.startX, this.startY, this.endY, 10); // Initial call
    }

    createBolt(x, y, targetY, deviation) {
      this.segments.push({ x1: x, y1: y, x2: x, y2: y }); // Start with a tiny segment

      let currentPoint = p.createVector(x, y);
      let segmentLength = 15;

      while (currentPoint.y < targetY) {
         let prevPoint = currentPoint.copy();
         let angle = p.HALF_PI + p.random(-p.PI / 8, p.PI / 8); // Mostly downwards, slight random angle

         // Randomly branch
         if (p.random() < 0.1 && this.segments.length < 20) { // Limit branches
             let branchEndX = currentPoint.x + p.random(-deviation * 3, deviation * 3);
             let branchEndY = currentPoint.y + segmentLength * p.random(1.5, 3);
             this.createBolt(currentPoint.x, currentPoint.y, branchEndY, deviation * 0.8); // Recursive call for branch
         }


         currentPoint.x += p.random(-deviation, deviation);
         currentPoint.y += segmentLength + p.random(-segmentLength * 0.2, segmentLength * 0.2);
         currentPoint.y = p.min(currentPoint.y, targetY); // Don't overshoot target Y

         this.segments.push({
            x1: prevPoint.x,
            y1: prevPoint.y,
            x2: currentPoint.x,
            y2: currentPoint.y,
            thickness: p.random(1, 5) * (this.alpha / this.maxAlpha) // Thicker when brighter
         });

         // Small chance to drastically change direction
          if (p.random() < 0.05) {
             deviation *= 1.5;
          } else {
              deviation *= 0.95; // Reduce deviation gradually
          }
          deviation = p.max(deviation, 1);


          segmentLength = p.random(10, 25);
      }
    }


    update() {
       if (this.active) {
          this.timer--;
          // Fade out quickly after initial flash
          if (this.timer < this.flashDuration * 0.5) {
             this.alpha = p.map(this.timer, 0, this.flashDuration * 0.5, 0, this.maxAlpha);
          } else {
              this.alpha = this.maxAlpha; // Stay bright initially
          }


          if (this.timer <= 0) {
             this.active = false;
             this.alpha = 0;
          }
       }
    }

    draw() {
       if (!this.active || this.alpha <= 0) return;

       // Draw main flash effect (bright overlay)
       p.fill(230, 230, 255, this.alpha * 0.8); // Whitish-blue overlay
       p.noStroke();
       p.rect(0, 0, p.width, p.height);

       // Draw the bolt segments
       p.stroke(this.color); // Use calculated color with alpha
       for (let seg of this.segments) {
          p.strokeWeight(seg.thickness);
          p.line(seg.x1, seg.y1, seg.x2, seg.y2);
       }
    }
 }

  class ChimneySmokeParticle {
     constructor(x, y, size, vx, vy) {
        this.pos = p.createVector(x, y);
        this.vel = p.createVector(vx, vy);
        this.acc = p.createVector(0, p.random(-0.01, -0.005)); // Gentle upward acceleration/buoyancy
        this.baseSize = size;
        this.size = this.baseSize;
        this.alpha = p.random(100, 180);
        this.maxLife = p.random(100, 200);
        this.life = this.maxLife;
        this.color = Colors.Smoke();
        this.noiseOffsetX = p.random(1000);
      }

      update() {
        this.life--;
        this.alpha = p.map(this.life, 0, this.maxLife, 0, p.alpha(this.color)); // Fade out over life
        this.size = p.map(this.life, this.maxLife, 0, this.baseSize * 0.5, this.baseSize * 2.5); // Grow as it rises and fades

        // Add wind/turbulence using noise
        let wind = (p.noise(this.noiseOffsetX + p.frameCount * 0.02) - 0.5) * 0.1;
        this.acc.x += wind;

        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // Reset acceleration

        // Slow down velocity slightly (drag)
        this.vel.mult(0.98);
      }

      draw() {
        p.noStroke();
        p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), this.alpha);
        p.ellipse(this.pos.x, this.pos.y, this.size, this.size);
      }

      isDead() {
        return this.life <= 0 || this.alpha <= 0;
      }
  }


  // --- p5.js Sketch Functions ---

  p.setup = () => {
    // p.frameRate(30); // Optional: Set frame rate

    // Initialize time (e.g., start at sunrise)
    TIME = 6.0;

    const soilLevel = p.height * 0.75;
    soil = new Soil(soilLevel);

    // Create houses - vary position, width, height
    let currentX = p.width * 0.1;
    let houseSpacing = p.width * 0.1;
    for (let i = 0; i < 3; i++) {
       let hWidth = p.random(p.width * 0.1, p.width * 0.18);
       let hHeight = p.random(p.height * 0.15, p.height * 0.25);
       houses.push(new House(currentX, hWidth, hHeight, soil));
       currentX += hWidth + p.random(houseSpacing * 0.5, houseSpacing * 1.5);
       if (currentX > p.width * 0.8) break; // Don't place too many
    }


    sun = new Sun(p.width * 0.05);
    moon = new Moon(p.width * 0.05);

    // Initialize stars
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push(new Star(p.random(p.width), p.random(p.height * 0.7), p.random(1, 3)));
    }
     shootingStars.push(new ShootingStar()); // Add one shooting star initially

    // Initialize clouds at different heights
    for (let i = 0; i < NUM_CLOUDS; i++) {
      let yPos = p.random(p.height * 0.1, p.height * 0.4);
      let sizeFactor = p.random(MIN_CLOUD_SIZE_FACTOR, MAX_CLOUD_SIZE_FACTOR);
      clouds.push(new Cloud(yPos, sizeFactor));
    }

    // Initialize birds
    for (let i = 0; i < NUM_BIRDS; i++) {
       birds.push(new Bird(p.random(p.height * 0.1, p.height * 0.5), soilLevel));
    }

    // Initialize flowers on the ground
    for (let i = 0; i < NUM_FLOWERS; i++) {
       flowers.push(new Flower(p.random(p.width), soilLevel));
    }

    // Initialize trees
    let treePositions = [p.width * 0.2, p.width * 0.5, p.width * 0.85]; // Example positions
    // Ensure trees don't overlap houses too much
    for(let treeX of treePositions) {
       let canPlace = true;
       for(let house of houses) {
          if (treeX > house.houseCorner.x - 20 && treeX < house.houseCorner.x + house.houseWidth + 20) {
             canPlace = false;
             break;
          }
       }
       if (canPlace) {
          trees.push(new Tree(treeX, soilLevel));
       }
    }
     // Add a couple more random trees if space allows
     for (let i = 0; i < NUM_TREES - trees.length; i++) {
        let treeX = p.random(p.width);
        let canPlace = true;
        for(let house of houses) {
           if (treeX > house.houseCorner.x - 20 && treeX < house.houseCorner.x + house.houseWidth + 20) {
              canPlace = false;
              break;
           }
        }
        if (canPlace) {
           trees.push(new Tree(treeX, soilLevel));
        }
     }


     // Initialize grass blades
     for (let i = 0; i < NUM_GRASS; i++) {
       grassBlades.push(new GrassBlade(p.random(p.width), soilLevel));
    }

    // Initialize weather elements (Rainbow and Lightning only)
    rainbow = new Rainbow();
    lightning = new Lightning();
    // No need to initialize snowflakes array

  }; // End of setup

  function updateSkyColor() {
    let c1z, c1h, c2z, c2h, lerpAmt;

    // Determine transition phase and colors
    if (TIME >= NIGHT_END && TIME < SUNRISE_PEAK) { // Sunrise transition
       c1z = Colors.DeepNightZenith(); c1h = Colors.DeepNightHorizon();
       c2z = Colors.SunriseZenith(); c2h = Colors.SunriseHorizon();
       lerpAmt = smoothMap(TIME, NIGHT_END, SUNRISE_PEAK, 0, 1);
    } else if (TIME >= SUNRISE_PEAK && TIME < DAY_START) { // Morning transition
       c1z = Colors.SunriseZenith(); c1h = Colors.SunriseHorizon();
       c2z = Colors.DayZenith(); c2h = Colors.DayHorizon();
       lerpAmt = smoothMap(TIME, SUNRISE_PEAK, DAY_START, 0, 1);
    } else if (TIME >= DAY_START && TIME < SUNSET_START) { // Daytime
       c1z = Colors.DayZenith(); c1h = Colors.DayHorizon();
       c2z = c1z; c2h = c1h; // No transition needed
       lerpAmt = 0;
    } else if (TIME >= SUNSET_START && TIME < SUNSET_PEAK) { // Sunset transition
       c1z = Colors.DayZenith(); c1h = Colors.DayHorizon();
       c2z = Colors.SunsetZenith(); c2h = Colors.SunsetHorizon();
       lerpAmt = smoothMap(TIME, SUNSET_START, SUNSET_PEAK, 0, 1);
    } else if (TIME >= SUNSET_PEAK && TIME < NIGHT_START) { // Evening transition
       c1z = Colors.SunsetZenith(); c1h = Colors.SunsetHorizon();
       c2z = Colors.DeepNightZenith(); c2h = Colors.DeepNightHorizon();
       lerpAmt = smoothMap(TIME, SUNSET_PEAK, NIGHT_START, 0, 1);
    } else { // Nighttime
       c1z = Colors.DeepNightZenith(); c1h = Colors.DeepNightHorizon();
       c2z = c1z; c2h = c1h; // No transition needed
       lerpAmt = 0;
    }

    // Lerp between the two color sets based on time
    skyColorZenith = lerpColor(c1z, c2z, lerpAmt);
    skyColorHorizon = lerpColor(c1h, c2h, lerpAmt);

     // Darken sky if raining (removed snowy check)
    if (weatherState === "rainy") {
       let darkenFactor = p.map(weatherTimer, 0, 150, 1.0, 0.6, true); // Darken over 150 frames
       skyColorZenith = p.color(p.red(skyColorZenith) * darkenFactor, p.green(skyColorZenith) * darkenFactor, p.blue(skyColorZenith) * darkenFactor);
       skyColorHorizon = p.color(p.red(skyColorHorizon) * darkenFactor, p.green(skyColorHorizon) * darkenFactor, p.blue(skyColorHorizon) * darkenFactor);
    }
  }

  function drawSkyGradient() {
    p.noFill();
    // Draw vertical gradient from zenith to horizon
    for (let y = 0; y < p.height; y++) {
      let inter = p.map(y, 0, p.height * 0.8, 0, 1); // Gradient mostly in top 80%
      let c = lerpColor(skyColorZenith, skyColorHorizon, inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }
    p.noStroke();
  }

  function updateWeather() {
      weatherTimer++;

      // Change weather state randomly after some time
      if (weatherTimer > p.random(1000, 3000)) { // Change every ~16-50 seconds
         let prevState = weatherState;
         let chance = p.random();
         // Only switch between clear and rainy
         if (chance < 0.5) {
            weatherState = "clear";
         } else { // chance >= 0.5
            weatherState = "rainy";
            lightningTimer = p.random(100, 500); // Reset lightning timer for rain
         }
         // Removed snowy state logic

         if (weatherState !== prevState) {
            weatherTimer = 0; // Reset timer for new state transition
             // Handle transitions out of rain
             if (prevState === "rainy" && weatherState === "clear") {
                 // Only show rainbow during the day after rain stops
                 if (TIME > SUNRISE_PEAK && TIME < SUNSET_PEAK) {
                    rainbow.show(); // Chance of rainbow after rain stops
                 } else {
                    rainbow.hide(); // Don't show rainbow at night
                 }
             } else {
                 rainbow.hide(); // Hide rainbow if transitioning to rain or if it wasn't clear before
             }
         }
      }

      // --- Manage Weather Effects ---

      // Rain
      if (weatherState === "rainy" && weatherTimer > 50) { // Start raining after a short delay
         if (p.random() < 0.8) { // Density of rain
             raindrops.push(new Raindrop(p.random(p.width), p.random(-50, 0)));
         }
         // Lightning flashes during rain
         lightningTimer--;
         if (lightningTimer <= 0 && p.random() < 0.01) {
             lightning.flash();
             lightningTimer = p.random(200, 800); // Time until next possible flash
         }
         rainbow.hide(); // No rainbow while it's raining
      } else {
         // If not raining, check if rainbow should fade
         if (rainbow.active && rainbow.alpha > 0) {
             // Keep updating (fading in/out)
             rainbow.update();
         } else if (rainbow.active && weatherState !== "clear") {
             // Force hide if weather changes back from clear while rainbow is showing
             rainbow.hide();
         }
          // Hide rainbow if it becomes night while it's active
         if (rainbow.active && (TIME < SUNRISE_PEAK || TIME > SUNSET_PEAK)) {
             rainbow.hide();
         }
      }

      // Snow logic completely removed

      // Update active weather elements
      lightning.update();
      rainbow.update();


      // Update and remove off-screen raindrops
      for (let i = raindrops.length - 1; i >= 0; i--) {
         raindrops[i].update(soil.getSoilHeight());
         if (raindrops[i].isOffScreen(soil.getSoilHeight())) {
             raindrops.splice(i, 1);
         }
      }

      // Update and remove off-screen snowflakes loop removed
  }

  p.draw = () => {
    // --- Update Time ---
    // Increment time (e.g., 1 hour every 30 seconds -> 30 * 30 = 900 frames)
    // Frame rate dependent! Adjust 900 for desired day length.
    TIME += (24 / (30 * 60)); // 1 real minute = 1 game day
    if (TIME >= 24) {
      TIME = 0; // Reset time after 24 hours
      moon.phase += p.random(0.02, 0.05); // Slightly change phase each day
      if(moon.phase > 1) moon.phase -= 1;
    }

    // --- Update ---
    updateSkyColor();
    updateWeather();
    const soilLevel = soil.getSoilHeight();

    // --- Drawing Layers (Back to Front) ---

    // 1. Sky Gradient
    drawSkyGradient();

    // 1.5. Lightning Flash (drawn over sky, behind stars/moon)
    lightning.draw();

    // 2. Stars & Moon
    stars.forEach(star => star.draw()); // Update is called within draw
    shootingStars.forEach(ss => { ss.update(); ss.draw(); });
    moon.draw(soilLevel); // Update is called within draw

    // 3. Sun
    sun.draw(soilLevel); // Update is called within draw

    // 4. Rainbow (behind clouds, only during day)
    if (TIME > SUNRISE_PEAK && TIME < SUNSET_PEAK) {
        rainbow.draw();
    }


    // 5. Clouds
    clouds.forEach(cloud => cloud.draw()); // Update is called within draw

    // 6. Birds (drawn before houses/trees)
    birds.forEach(bird => {
       bird.update(birds); // Pass the whole flock for flocking calculations
       bird.draw();
    });

    // 7. Landscape Background (Trees far back)
    trees.forEach(tree => tree.draw()); // Trees drawn before soil line

    // 8. Soil
    soil.draw();

    // 9. Ground Elements (Grass, Flowers)
    grassBlades.forEach(gb => gb.draw());
    flowers.forEach(flower => flower.draw(soilLevel));

    // 10. Houses
    houses.forEach(house => house.draw()); // Update is called within draw

    // 11. Chimney Smoke (drawn over houses)
    for (let i = chimneySmokeParticles.length - 1; i >= 0; i--) {
       let particle = chimneySmokeParticles[i];
       particle.update();
       particle.draw();
       if (particle.isDead()) {
          chimneySmokeParticles.splice(i, 1);
       }
    }

    // 12. Fireflies (drawn over everything except weather)
    fireflies.forEach(ff => {
       ff.update();
       ff.draw();
    });

    // 13. Weather Effects (Rain - drawn last for visibility)
    raindrops.forEach(rd => rd.draw());
    // Snowflakes drawing removed


    // --- Optional: Display Time/Weather Info ---
    //  p.fill(255);
    //  p.textSize(14);
    //  p.textAlign(p.LEFT, p.TOP);
    //  p.text(`Time: ${TIME.toFixed(2)}`, 10, 10);
    //  p.text(`Weather: ${weatherState} (${weatherTimer})`, 10, 30);
      //p.text(`FPS: ${p.frameRate().toFixed(1)}`, 10, 50);

  }; // End of draw

  // --- Window Resizing ---
  p.windowResized = () => {
      //  p.resizeCanvas(p.windowWidth, p.windowHeight * 0.8);
       // Re-initialize or reposition elements if needed based on new size
       // This simple example doesn't dynamically resize elements,
       // but you might need to recalculate positions/sizes here in a more robust sketch.
       // For example:
       // soil.y = p.height * 0.75;
       // sun.size = p.width * 0.05;
       // etc.
       // Could potentially call p.setup() again, but that resets everything.
   };


}; // End of HomeSketch definition

export default HomeSketch;