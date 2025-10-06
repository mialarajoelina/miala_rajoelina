const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const audioControl = document.getElementById("audioControl");
const shootMessage = document.getElementById("shootMessage");
const shootCounterDisplay = document.getElementById("shootCounter");

// Sons avec gestion d'erreur améliorée
let backgroundMusic, startSound, shootSound, boopSound, gameOverSound, winklSound;

function initAudio() {
    try {
        backgroundMusic = new Audio('background.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.3; // Volume réduit pour la musique de fond

        startSound = new Audio('audio/start.mp3');
        shootSound = new Audio('audio/shoot.mp3');
        boopSound = new Audio('audio/boop.mp3');
        gameOverSound = new Audio('audio/over.mp3');
        winklSound = new Audio('audio/winkl.mp3');

        // Gestion des erreurs de chargement
        [backgroundMusic, startSound, shootSound, boopSound, gameOverSound, winklSound].forEach((sound, index) => {
            sound.addEventListener('error', (e) => {
                console.warn(`Erreur de chargement du son ${index}:`, e);
            });
            sound.load(); // Forcer le chargement
        });

        return true;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation audio:', error);
        return false;
    }
}

let isMuted = false;
let audioStarted = false;
let audioInitialized = false;

audioControl.addEventListener('click', () => {
    isMuted = !isMuted;
    if (audioInitialized) {
        [backgroundMusic, startSound, shootSound, boopSound, gameOverSound, winklSound].forEach(sound => {
            if (sound) sound.muted = isMuted;
        });
    }
    audioControl.innerHTML = isMuted ? "<i class='fas fa-volume-mute'></i>" : "<i class='fas fa-volume-up'></i>";
});

function startAudio() {
    if (!audioStarted) {
        audioStarted = true;
        audioInitialized = initAudio();

        if (audioInitialized) {
            // Démarrer la musique de fond automatiquement
            backgroundMusic.play().catch(e => console.warn('Erreur backgroundMusic:', e));
            
            // Jouer le son de démarrage
            startSound.play().catch(e => console.warn('Erreur startSound:', e));
        }
    }
}

// Démarrer automatiquement l'audio au chargement de la page
window.addEventListener('load', () => {
    setTimeout(startAudio, 500); // Délai pour éviter les blocages navigateur
});

// Images
const playerImg = new Image();
playerImg.src = 'pixels/dago.png';

// Modification : Charger tous les obstacles jusqu'à 30
const obstacleImages = [];
for (let i = 1; i <= 30; i++) {
    const img = new Image();
    img.src = `pixels/obstacle${i}.png`;
    img.onerror = () => {
        console.warn(`Impossible de charger pixels/obstacle${i}.png`);
        // En cas d'erreur, utiliser une image de secours
        if (i > 8) {
            img.src = 'pixels/obstacle1.png';
        }
    };
    obstacleImages.push(img);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    size: 50,
    speed: 5,
    targetX: null,
    canShoot: false
};

let obstacles = [];
let poops = [];
let gameRunning = true;
let score = 0;
let startTime = Date.now();
let elapsedTime = 0;
let shootCount = 0;

function createObstacle() {
    if (!gameRunning) return;
    let x = Math.random() * (canvas.width - 60);

    // Modification : utiliser tous les obstacles disponibles (1-30)
    const randomImg = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];

    obstacles.push({
        x,
        y: -60,
        size: 60,
        speed: Math.random() * 3 + 2,
        img: randomImg
    });
}

function shootPoop() {
    if (!player.canShoot || poops.length > 0) return;

    if (audioInitialized && shootSound) {
        shootSound.play().catch(e => console.warn('Erreur shootSound:', e));
    }

    shootCount++;
    shootCounterDisplay.innerHTML = `<i class="fas fa-bullseye"></i> ${shootCount}`;

    poops.push({
        x: player.x + player.size / 2,
        y: player.y,
        size: 60,
        speed: 10
    });
}

function update() {
    if (!gameRunning) return;

    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    timerDisplay.innerHTML = `<i class="fas fa-stopwatch"></i> ${elapsedTime}s`;

    player.canShoot = score >= 160;

    if (player.canShoot && !shootMessage.style.display) {
        shootMessage.style.display = 'block';
        if (audioInitialized && winklSound) {
            winklSound.play().catch(e => console.warn('Erreur winklSound:', e));
        }
        setTimeout(() => {
            shootMessage.style.display = 'none';
        }, 2000); // Augmenté à 2 secondes pour mieux voir le message
    }

    if (player.targetX !== null) {
        if (player.x < player.targetX) {
            player.x += player.speed;
            if (player.x > player.targetX) player.x = player.targetX;
        } else if (player.x > player.targetX) {
            player.x -= player.speed;
            if (player.x < player.targetX) player.x = player.targetX;
        }
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;

    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].y += obstacles[i].speed;

        if (
            player.x < obstacles[i].x + obstacles[i].size &&
            player.x + player.size > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].size &&
            player.y + player.size > obstacles[i].y
        ) {
            gameRunning = false;
            if (audioInitialized) {
                if (gameOverSound) gameOverSound.play().catch(e => console.warn('Erreur gameOverSound:', e));
                if (backgroundMusic) backgroundMusic.pause();
            }
            alert(`Game Over! Score: ${score}, Temps: ${elapsedTime}s, Tirs: ${shootCount}`);
            location.reload();
        }
    }

    for (let i = poops.length - 1; i >= 0; i--) {
        poops[i].y -= poops[i].speed;

        for (let j = obstacles.length - 1; j >= 0; j--) {
            if (
                poops[i].x < obstacles[j].x + obstacles[j].size &&
                poops[i].x + poops[i].size > obstacles[j].x &&
                poops[i].y < obstacles[j].y + obstacles[j].size &&
                poops[i].y + poops[i].size > obstacles[j].y
            ) {
                obstacles.splice(j, 1);
                poops.splice(i, 1);
                if (audioInitialized && boopSound) {
                    boopSound.play().catch(e => console.warn('Erreur boopSound:', e));
                }
                break;
            }
        }

        if (poops[i] && poops[i].y < 0) {
            poops.splice(i, 1);
        }
    }

    obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);

    score++;
    scoreDisplay.innerHTML = `<i class="fas fa-star"></i> Score: ${score}`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);

    for (let obstacle of obstacles) {
        ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.size, obstacle.size);
    }

    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    for (let poop of poops) {
        ctx.fillText('💩', poop.x, poop.y); // Gardé l'emoji caca
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function setPlayerTarget(clientX) {
    player.targetX = clientX - player.size / 2;
}

canvas.addEventListener('mousemove', (e) => {
    setPlayerTarget(e.clientX);
});

canvas.addEventListener('touchmove', (e) => {
    setPlayerTarget(e.touches[0].clientX);
});

canvas.addEventListener('click', () => {
    shootPoop();
});

document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

setInterval(createObstacle, 1000);
gameLoop();