// Mod de Buraco Negro para Sandboxels
// Adiciona um buraco negro que puxa elementos com distância ajustável

var blackHolePullDistance = 50; // Distância padrão de atração
var blackHolePullSpeed = 5; // Velocidade de sucção (1-10)
var blackHoleParticlesEnabled = true; // Partículas visuais ativadas
var blackHoleOrbitMode = false; // Modo órbita ativado
var blackHoleVisualDeletion = true; // Efeito visual de deleção (vermelho)
var blackHoleGravityWaves = true; // Ondas gravitacionais pulsantes
var uiMinimized = false; // Estado da UI

// Variáveis do Buraco Branco
var whiteHolePushDistance = 50; // Distância de repulsão
var whiteHolePushSpeed = 5; // Velocidade de repulsão
var whiteHoleParticlesEnabled = true; // Partículas visuais brancas
var whiteHoleOrbitMode = false; // Modo órbita reverso
var whiteHoleCreationEffect = true; // Efeito de criação de partículas
var whiteHoleGravityWaves = true; // Ondas gravitacionais brancas
var whiteHoleUiMinimized = false; // Estado da UI do buraco branco

// Interação entre buracos
var interactionParticles = true; // Partículas quando próximos

// Criar elemento Buraco Negro
elements.black_hole = {
    color: "#000000",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    density: 99999,
    darkText: true,
    hardness: 1,
    breakInto: "black_hole", // Não pode ser quebrado
    insulate: true,
    noMix: true,
    forceSave: true,
    ignore: ["black_hole", "void_particle"], // Imune a outros elementos
    reactions: {}, // Sem reações químicas
    temp: -273, // Temperatura absoluta zero
    tempHigh: 999999, // Não derrete
    tempLow: -999999, // Não congela
    burn: 0,
    burnTime: 0,
    conduct: 0,
    onSelect: function() {
        if (blackHoleGravityWaves) {
            // Mostrar ondas gravitacionais visuais quando selecionado
            console.log("🌊 Ondas Gravitacionais ativas!");
        }
    },
    tick: function(pixel) {
        // Executar apenas a cada 3 ticks para reduzir carga
        if (pixel.age === undefined) pixel.age = 0;
        pixel.age++;
        if (pixel.age % 3 !== 0) return;
        
        // Reduzir área de busca para melhor performance
        var searchRadius = Math.min(blackHolePullDistance, 40);
        var step = 3; // Pular pixels para reduzir iterações
        
        // Calcular força baseada na velocidade configurada
        var speedMultiplier = blackHolePullSpeed / 5; // Normalizar (1-10 vira 0.2-2)
        
        // Procurar pixels ao redor dentro da distância definida
        for (var i = -searchRadius; i <= searchRadius; i += step) {
            for (var j = -searchRadius; j <= searchRadius; j += step) {
                var x = pixel.x + i;
                var y = pixel.y + j;
                
                // Verificar se está dentro dos limites
                if (!isEmpty(x, y, true)) {
                    var distance = Math.sqrt(i*i + j*j);
                    
                    // Se estiver dentro do raio e não for outro buraco negro
                    if (distance <= searchRadius && distance > 1) {
                        var targetPixel = pixelMap[x][y];
                        
                        if (targetPixel && targetPixel.element !== "black_hole" && targetPixel.element !== "void_particle") {
                            // Calcular direção do pixel para o buraco negro
                            var dx = pixel.x - x;
                            var dy = pixel.y - y;
                            
                            // Normalizar e aplicar força gravitacional com velocidade
                            var force = (1 - (distance / searchRadius)) * speedMultiplier;
                            
                            if (blackHoleOrbitMode) {
                                // MODO ÓRBITA - movimento tangencial
                                if (Math.random() < force * 0.2) {
                                    // Calcular direção perpendicular (tangente)
                                    var tangentX = -Math.sign(dy);
                                    var tangentY = Math.sign(dx);
                                    
                                    var moveX = x + tangentX;
                                    var moveY = y + tangentY;
                                    
                                    // Adicionar um pouco de força centrípeta
                                    if (distance > searchRadius * 0.3) {
                                        moveX += Math.sign(dx) * (Math.random() < 0.3 ? 1 : 0);
                                        moveY += Math.sign(dy) * (Math.random() < 0.3 ? 1 : 0);
                                    }
                                    
                                    if (isEmpty(moveX, moveY)) {
                                        movePixel(targetPixel, moveX, moveY);
                                    } else if (isEmpty(moveX, y)) {
                                        movePixel(targetPixel, moveX, y);
                                    } else if (isEmpty(x, moveY)) {
                                        movePixel(targetPixel, x, moveY);
                                    }
                                }
                            } else {
                                // MODO SUCÇÃO - puxar direto
                                if (Math.random() < force * 0.15) {
                                    var moveX = x + Math.sign(dx);
                                    var moveY = y + Math.sign(dy);
                                    
                                    if (isEmpty(moveX, moveY)) {
                                        movePixel(targetPixel, moveX, moveY);
                                    } else if (isEmpty(moveX, y)) {
                                        movePixel(targetPixel, moveX, y);
                                    } else if (isEmpty(x, moveY)) {
                                        movePixel(targetPixel, x, moveY);
                                    }
                                }
                            }
                            
                            // Efeito de deleção
                            if (distance < 3) {
                                if (blackHoleVisualDeletion) {
                                    // Efeito visual - pixel fica vermelho antes de deletar
                                    if (!targetPixel.bhDamage) {
                                        targetPixel.bhDamage = 0;
                                    }
                                    targetPixel.bhDamage += 0.2;
                                    
                                    // Mudar cor para vermelho gradualmente
                                    var redAmount = Math.min(255, Math.floor(targetPixel.bhDamage * 50));
                                    targetPixel.color = `rgb(${redAmount}, ${Math.max(0, 100 - redAmount)}, 0)`;
                                    
                                    // Deletar quando completamente vermelho
                                    if (targetPixel.bhDamage >= 5) {
                                        deletePixel(x, y);
                                    }
                                } else {
                                    // Deleção instantânea
                                    deletePixel(x, y);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Efeito visual: criar pontos escuros ao redor (se ativado) - muito menos frequente
        if (blackHoleParticlesEnabled && Math.random() < 0.03) {
            var angle = Math.random() * Math.PI * 2;
            var dist = Math.random() * searchRadius * 0.5;
            var vx = Math.floor(pixel.x + Math.cos(angle) * dist);
            var vy = Math.floor(pixel.y + Math.sin(angle) * dist);
            
            if (isEmpty(vx, vy)) {
                createPixel("void_particle", vx, vy);
            }
        }
        
        // Ondas Gravitacionais - pulsos visuais periódicos
        if (blackHoleGravityWaves && pixel.age % 30 === 0) {
            var waveRadius = 8 + (pixel.age % 60) / 10; // Pulso crescente
            var points = 12; // Número de pontos na onda
            
            for (var p = 0; p < points; p++) {
                var angle = (Math.PI * 2 * p) / points;
                var wx = Math.floor(pixel.x + Math.cos(angle) * waveRadius);
                var wy = Math.floor(pixel.y + Math.sin(angle) * waveRadius);
                
                if (isEmpty(wx, wy)) {
                    createPixel("gravity_wave", wx, wy);
                }
            }
        }
        
        // Verificar interação com buraco branco próximo
        if (interactionParticles && pixel.age % 5 === 0) {
            var checkRadius = 30;
            for (var ix = -checkRadius; ix <= checkRadius; ix += 5) {
                for (var iy = -checkRadius; iy <= checkRadius; iy += 5) {
                    var cx = pixel.x + ix;
                    var cy = pixel.y + iy;
                    
                    if (!isEmpty(cx, cy, true)) {
                        var checkPixel = pixelMap[cx][cy];
                        if (checkPixel && checkPixel.element === "white_hole") {
                            var distance = Math.sqrt(ix*ix + iy*iy);
                            if (distance < 25) {
                                // Criar partículas de interação ao redor de ambos
                                var midX = Math.floor((pixel.x + cx) / 2);
                                var midY = Math.floor((pixel.y + cy) / 2);
                                
                                if (Math.random() < 0.3 && isEmpty(midX, midY)) {
                                    createPixel("interaction_particle", midX, midY);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

// Partículas visuais do buraco negro
elements.void_particle = {
    color: ["#0a0a0a", "#1a1a1a", "#050505"],
    behavior: behaviors.LIQUID,
    category: "hidden",
    state: "gas",
    density: -1,
    hidden: true,
    tick: function(pixel) {
        pixel.temp = -273;
        // Desaparecer muito mais rápido para reduzir lag
        if (Math.random() < 0.5) {
            deletePixel(pixel.x, pixel.y);
        }
    }
};

// Ondas gravitacionais visuais
elements.gravity_wave = {
    color: ["#1a0033", "#2a0055", "#150044"],
    behavior: behaviors.LIQUID,
    category: "hidden",
    state: "gas",
    density: -2,
    hidden: true,
    tick: function(pixel) {
        // Pulso visual - desaparece rapidamente
        if (Math.random() < 0.6) {
            deletePixel(pixel.x, pixel.y);
        }
    }
};

// Criar elemento Buraco Branco (oposto do negro)
elements.white_hole = {
    color: "#FFFFFF",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    density: 99999,
    hardness: 1,
    breakInto: "white_hole",
    insulate: true,
    noMix: true,
    forceSave: true,
    ignore: ["white_hole", "white_particle"],
    reactions: {},
    temp: 999999, // Temperatura extrema
    tempHigh: 9999999,
    tempLow: -999999,
    burn: 0,
    burnTime: 0,
    conduct: 0,
    tick: function(pixel) {
        if (pixel.age === undefined) pixel.age = 0;
        pixel.age++;
        if (pixel.age % 3 !== 0) return;
        
        var searchRadius = Math.min(whiteHolePushDistance, 40);
        var step = 3;
        var speedMultiplier = whiteHolePushSpeed / 5;
        
        // Empurrar pixels para longe (oposto do buraco negro)
        for (var i = -searchRadius; i <= searchRadius; i += step) {
            for (var j = -searchRadius; j <= searchRadius; j += step) {
                var x = pixel.x + i;
                var y = pixel.y + j;
                
                if (!isEmpty(x, y, true)) {
                    var distance = Math.sqrt(i*i + j*j);
                    
                    if (distance <= searchRadius && distance > 1) {
                        var targetPixel = pixelMap[x][y];
                        
                        if (targetPixel && targetPixel.element !== "white_hole" && targetPixel.element !== "white_particle") {
                            var dx = x - pixel.x; // Inverso do buraco negro
                            var dy = y - pixel.y;
                            
                            var force = (1 - (distance / searchRadius)) * speedMultiplier;
                            
                            if (whiteHoleOrbitMode) {
                                // Modo órbita reverso
                                if (Math.random() < force * 0.2) {
                                    var tangentX = Math.sign(dy);
                                    var tangentY = -Math.sign(dx);
                                    
                                    var moveX = x + tangentX;
                                    var moveY = y + tangentY;
                                    
                                    if (distance < searchRadius * 0.7) {
                                        moveX += Math.sign(dx) * (Math.random() < 0.3 ? 1 : 0);
                                        moveY += Math.sign(dy) * (Math.random() < 0.3 ? 1 : 0);
                                    }
                                    
                                    if (isEmpty(moveX, moveY)) {
                                        movePixel(targetPixel, moveX, moveY);
                                    }
                                }
                            } else {
                                // Modo empurrar
                                if (Math.random() < force * 0.15) {
                                    var moveX = x + Math.sign(dx);
                                    var moveY = y + Math.sign(dy);
                                    
                                    if (isEmpty(moveX, moveY)) {
                                        movePixel(targetPixel, moveX, moveY);
                                    } else if (isEmpty(moveX, y)) {
                                        movePixel(targetPixel, moveX, y);
                                    } else if (isEmpty(x, moveY)) {
                                        movePixel(targetPixel, x, moveY);
                                    }
                                }
                            }
                            
                            // Efeito de criação - criar partículas próximas
                            if (whiteHoleCreationEffect && distance < 4 && Math.random() < 0.1) {
                                var createX = pixel.x + Math.floor(Math.random() * 5 - 2);
                                var createY = pixel.y + Math.floor(Math.random() * 5 - 2);
                                if (isEmpty(createX, createY)) {
                                    createPixel("white_particle", createX, createY);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Partículas brancas ao redor
        if (whiteHoleParticlesEnabled && Math.random() < 0.03) {
            var angle = Math.random() * Math.PI * 2;
            var dist = Math.random() * searchRadius * 0.5;
            var vx = Math.floor(pixel.x + Math.cos(angle) * dist);
            var vy = Math.floor(pixel.y + Math.sin(angle) * dist);
            
            if (isEmpty(vx, vy)) {
                createPixel("white_particle", vx, vy);
            }
        }
        
        // Ondas gravitacionais brancas
        if (whiteHoleGravityWaves && pixel.age % 30 === 0) {
            var waveRadius = 8 + (pixel.age % 60) / 10;
            var points = 12;
            
            for (var p = 0; p < points; p++) {
                var angle = (Math.PI * 2 * p) / points;
                var wx = Math.floor(pixel.x + Math.cos(angle) * waveRadius);
                var wy = Math.floor(pixel.y + Math.sin(angle) * waveRadius);
                
                if (isEmpty(wx, wy)) {
                    createPixel("white_wave", wx, wy);
                }
            }
        }
        
        // Verificar interação com buraco negro próximo
        if (interactionParticles && pixel.age % 5 === 0) {
            var checkRadius = 30;
            for (var ix = -checkRadius; ix <= checkRadius; ix += 5) {
                for (var iy = -checkRadius; iy <= checkRadius; iy += 5) {
                    var cx = pixel.x + ix;
                    var cy = pixel.y + iy;
                    
                    if (!isEmpty(cx, cy, true)) {
                        var checkPixel = pixelMap[cx][cy];
                        if (checkPixel && checkPixel.element === "black_hole") {
                            var distance = Math.sqrt(ix*ix + iy*iy);
                            if (distance < 25) {
                                var midX = Math.floor((pixel.x + cx) / 2);
                                var midY = Math.floor((pixel.y + cy) / 2);
                                
                                if (Math.random() < 0.3 && isEmpty(midX, midY)) {
                                    createPixel("interaction_particle", midX, midY);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

// Partículas do buraco branco
elements.white_particle = {
    color: ["#FFFFFF", "#F0F0F0", "#E8E8E8"],
    behavior: behaviors.LIQUID,
    category: "hidden",
    state: "gas",
    density: -3,
    hidden: true,
    tick: function(pixel) {
        if (Math.random() < 0.5) {
            deletePixel(pixel.x, pixel.y);
        }
    }
};

// Ondas gravitacionais brancas
elements.white_wave = {
    color: ["#FFFFCC", "#FFFF99", "#FFFFAA"],
    behavior: behaviors.LIQUID,
    category: "hidden",
    state: "gas",
    density: -2,
    hidden: true,
    tick: function(pixel) {
        if (Math.random() < 0.6) {
            deletePixel(pixel.x, pixel.y);
        }
    }
};

// Partículas de interação (quando buracos estão próximos)
elements.interaction_particle = {
    color: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0099"],
    behavior: behaviors.LIQUID,
    category: "hidden",
    state: "gas",
    density: 0,
    hidden: true,
    tick: function(pixel) {
        // Movimento caótico
        if (Math.random() < 0.3) {
            var dx = Math.floor(Math.random() * 3 - 1);
            var dy = Math.floor(Math.random() * 3 - 1);
            if (isEmpty(pixel.x + dx, pixel.y + dy)) {
                movePixel(pixel, pixel.x + dx, pixel.y + dy);
            }
        }
        // Desaparecer
        if (Math.random() < 0.4) {
            deletePixel(pixel.x, pixel.y);
        }
    }
};

// Adicionar controle de UI
if (typeof document !== 'undefined') {
    var uiMinimized = false;
    
    // Criar painel de controle UNIFICADO
    var controlPanel = document.createElement('div');
    controlPanel.id = 'holesControl';
    controlPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(40,40,40,0.95));
        color: white;
        padding: 18px;
        border-radius: 12px;
        font-family: 'Segoe UI', Arial, sans-serif;
        z-index: 10000;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        max-width: 300px;
        opacity: 1;
        transform: scale(1);
        backdrop-filter: blur(10px);
    `;
    
    controlPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid rgba(255,255,255,0.15); padding-bottom: 12px;">
            <h3 style="margin: 0; font-size: 17px; font-weight: 600; background: linear-gradient(135deg, #ffffff, #aaaaaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">🌌 Black & White Holes</h3>
            <button id="holesMinimizeBtn" style="
                background: linear-gradient(180deg, #000 0%, #000 48%, #fff 52%, #fff 100%);
                border: 2px solid rgba(255,255,255,0.3);
                width: 42px;
                height: 42px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 22px;
                font-weight: bold;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.2);
                position: relative;
                overflow: hidden;
            " onmouseover="this.style.transform='scale(1.15) rotate(180deg)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.3)';" onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.2)';">
                <span style="
                    background: linear-gradient(180deg, #fff 0%, #fff 48%, #000 52%, #000 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 24px;
                    font-weight: bold;
                    text-shadow: 0 0 10px rgba(255,255,255,0.5);
                ">B</span>
            </button>
        </div>
        
        <div id="holesContent" style="transition: opacity 0.3s ease;">
            <!-- BLACK HOLE SECTION -->
            <div style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 10px; margin-bottom: 14px; border-left: 4px solid #000; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">⚫ Black Hole</h4>
                
                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; opacity: 0.9;">
                    Pull Distance: <span id="bhDistanceValue" style="color: #4CAF50; font-weight: bold;">${blackHolePullDistance}</span>px
                </label>
                <input type="range" id="bhDistanceSlider" 
                       min="10" max="80" value="${blackHolePullDistance}" 
                       style="width: 100%; cursor: pointer; margin-bottom: 10px; accent-color: #000;">
                
                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; opacity: 0.9;">
                    Pull Speed: <span id="bhSpeedValue" style="color: #2196F3; font-weight: bold;">${blackHolePullSpeed}</span>
                </label>
                <input type="range" id="bhSpeedSlider" 
                       min="1" max="10" value="${blackHolePullSpeed}" 
                       style="width: 100%; cursor: pointer; margin-bottom: 10px; accent-color: #000;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
                    <label style="display: flex; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <input type="checkbox" id="bhOrbitToggle" style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                        🌀 Orbit
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <input type="checkbox" id="bhVisualDeletionToggle" checked style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                        🔥 Visual Del
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <input type="checkbox" id="bhGravityWavesToggle" checked style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                        🌊 Waves
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <input type="checkbox" id="bhParticlesToggle" checked style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                        ✨ Particles
                    </label>
                </div>
            </div>
            
            <!-- WHITE HOLE SECTION -->
            <div style="background: rgba(255,255,255,0.12); padding: 14px; border-radius: 10px; margin-bottom: 14px; border-left: 4px solid #fff; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">⚪ White Hole</h4>
                
                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; opacity: 0.9;">
                    Push Distance: <span id="whDistanceValue" style="color: #FF9800; font-weight: bold;">${whiteHolePushDistance}</span>px
                </label>
                <input type="range" id="whDistanceSlider" 
                       min="10" max="80" value="${whiteHolePushDistance}" 
                       style="width: 100%; cursor: pointer; margin-bottom: 10px; accent-color: #fff;">
                
                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; opacity: 0.9;">
                    Push Speed: <span id="whSpeedValue" style="color: #E91E63; font-weight: bold;">${whiteHolePushSpeed}</span>
                </label>
                <input type="range" id="whSpeedSlider" 
                       min="1" max="10" value="${whiteHolePushSpeed}" 
                       style="width: 100%; cursor: pointer; margin-bottom: 10px; accent-color: #fff;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
                    <label style="display: flex; align-items: center; cursor: pointer; background: rgba(0,0,0,0.1); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
                        <input type="checkbox" id="whOrbitToggle" style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                        🌀 Orbit
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; background: rgba(0,0,0,0.1); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
                        <input type="checkbox" id="whCreationToggle" checked style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                        ✨ Creation
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; background: rgba(0,0,0,0.1); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
                        <input type="checkbox" id="whGravityWavesToggle" checked style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                        🌊 Waves
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; background: rgba(0,0,0,0.1); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
                        <input type="checkbox" id="whParticlesToggle" checked style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                        💫 Particles
                    </label>
                </div>
            </div>
            
            <!-- INTERACTION SECTION -->
            <div style="background: linear-gradient(90deg, rgba(0,0,0,0.3), rgba(255,255,255,0.2)); padding: 12px; border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                <label style="display: flex; align-items: center; font-size: 12px; cursor: pointer; font-weight: 600;">
                    <input type="checkbox" id="interactionToggle" checked style="margin-right: 8px; cursor: pointer; width: 16px; height: 16px;">
                    ⚡ Interaction Particles
                </label>
                <div style="font-size: 10px; margin-top: 5px; opacity: 0.8; font-style: italic;">
                    When holes are near each other
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Função para configurar todos os event listeners
    function setupEventListeners() {
        // ===== BLACK HOLE EVENT LISTENERS =====
        var slider = document.getElementById('bhDistanceSlider');
        var valueDisplay = document.getElementById('bhDistanceValue');
        
        if (slider) {
            slider.addEventListener('input', function() {
                blackHolePullDistance = parseInt(this.value);
                valueDisplay.textContent = blackHolePullDistance;
            });
        }
        
        var speedSlider = document.getElementById('bhSpeedSlider');
        var speedDisplay = document.getElementById('bhSpeedValue');
        
        if (speedSlider) {
            speedSlider.addEventListener('input', function() {
                blackHolePullSpeed = parseInt(this.value);
                speedDisplay.textContent = blackHolePullSpeed;
            });
        }
        
        var orbitToggle = document.getElementById('bhOrbitToggle');
        if (orbitToggle) {
            orbitToggle.addEventListener('change', function() {
                blackHoleOrbitMode = this.checked;
            });
        }
        
        var visualDeletionToggle = document.getElementById('bhVisualDeletionToggle');
        if (visualDeletionToggle) {
            visualDeletionToggle.addEventListener('change', function() {
                blackHoleVisualDeletion = this.checked;
            });
        }
        
        var gravityWavesToggle = document.getElementById('bhGravityWavesToggle');
        if (gravityWavesToggle) {
            gravityWavesToggle.addEventListener('change', function() {
                blackHoleGravityWaves = this.checked;
                
                if (!blackHoleGravityWaves) {
                    for (var i = 0; i < width; i++) {
                        for (var j = 0; j < height; j++) {
                            if (pixelMap[i] && pixelMap[i][j] && pixelMap[i][j].element === "gravity_wave") {
                                deletePixel(i, j);
                            }
                        }
                    }
                }
            });
        }
        
        var particlesToggle = document.getElementById('bhParticlesToggle');
        if (particlesToggle) {
            particlesToggle.addEventListener('change', function() {
                blackHoleParticlesEnabled = this.checked;
                
                if (!blackHoleParticlesEnabled) {
                    for (var i = 0; i < width; i++) {
                        for (var j = 0; j < height; j++) {
                            if (pixelMap[i] && pixelMap[i][j] && pixelMap[i][j].element === "void_particle") {
                                deletePixel(i, j);
                            }
                        }
                    }
                }
            });
        }
        
        // ===== WHITE HOLE EVENT LISTENERS =====
        var whDistanceSlider = document.getElementById('whDistanceSlider');
        var whDistanceDisplay = document.getElementById('whDistanceValue');
        
        if (whDistanceSlider) {
            whDistanceSlider.addEventListener('input', function() {
                whiteHolePushDistance = parseInt(this.value);
                whDistanceDisplay.textContent = whiteHolePushDistance;
            });
        }
        
        var whSpeedSlider = document.getElementById('whSpeedSlider');
        var whSpeedDisplay = document.getElementById('whSpeedValue');
        
        if (whSpeedSlider) {
            whSpeedSlider.addEventListener('input', function() {
                whiteHolePushSpeed = parseInt(this.value);
                whSpeedDisplay.textContent = whiteHolePushSpeed;
            });
        }
        
        var whOrbitToggle = document.getElementById('whOrbitToggle');
        if (whOrbitToggle) {
            whOrbitToggle.addEventListener('change', function() {
                whiteHoleOrbitMode = this.checked;
            });
        }
        
        var whCreationToggle = document.getElementById('whCreationToggle');
        if (whCreationToggle) {
            whCreationToggle.addEventListener('change', function() {
                whiteHoleCreationEffect = this.checked;
            });
        }
        
        var whGravityWavesToggle = document.getElementById('whGravityWavesToggle');
        if (whGravityWavesToggle) {
            whGravityWavesToggle.addEventListener('change', function() {
                whiteHoleGravityWaves = this.checked;
                
                if (!whiteHoleGravityWaves) {
                    for (var i = 0; i < width; i++) {
                        for (var j = 0; j < height; j++) {
                            if (pixelMap[i] && pixelMap[i][j] && pixelMap[i][j].element === "white_wave") {
                                deletePixel(i, j);
                            }
                        }
                    }
                }
            });
        }
        
        var whParticlesToggle = document.getElementById('whParticlesToggle');
        if (whParticlesToggle) {
            whParticlesToggle.addEventListener('change', function() {
                whiteHoleParticlesEnabled = this.checked;
                
                if (!whiteHoleParticlesEnabled) {
                    for (var i = 0; i < width; i++) {
                        for (var j = 0; j < height; j++) {
                            if (pixelMap[i] && pixelMap[i][j] && pixelMap[i][j].element === "white_particle") {
                                deletePixel(i, j);
                            }
                        }
                    }
                }
            });
        }
        
        // ===== INTERACTION TOGGLE =====
        var interactionToggle = document.getElementById('interactionToggle');
        if (interactionToggle) {
            interactionToggle.addEventListener('change', function() {
                interactionParticles = this.checked;
                
                if (!interactionParticles) {
                    for (var i = 0; i < width; i++) {
                        for (var j = 0; j < height; j++) {
                            if (pixelMap[i] && pixelMap[i][j] && pixelMap[i][j].element === "interaction_particle") {
                                deletePixel(i, j);
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Função para alternar minimizado/expandido
    function toggleMinimize() {
        uiMinimized = !uiMinimized;
        
        if (uiMinimized) {
            // Minimizar - animação simples e suave
            controlPanel.style.transition = 'all 0.3s ease';
            controlPanel.style.padding = '8px';
            controlPanel.style.maxWidth = '58px';
            controlPanel.style.background = 'linear-gradient(180deg, #000 0%, #000 48%, #fff 52%, #fff 100%)';
            controlPanel.style.borderRadius = '50%';
            
            // Esconder conteúdo
            var content = document.getElementById('holesContent');
            var header = controlPanel.querySelector('div');
            if (content) content.style.display = 'none';
            if (header) header.style.display = 'none';
            
            // Criar botão minimizado
            controlPanel.innerHTML = `
                <button id="holesMinimizeBtn" style="
                    background: transparent;
                    border: none;
                    width: 42px;
                    height: 42px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='scale(1.2) rotate(180deg)'" onmouseout="this.style.transform='scale(1) rotate(0deg)'">
                    <span style="
                        background: linear-gradient(180deg, #fff 0%, #fff 48%, #000 52%, #000 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        font-size: 28px;
                        font-weight: bold;
                    ">B</span>
                </button>
            `;
            
            document.getElementById('holesMinimizeBtn').addEventListener('click', toggleMinimize);
            
        } else {
            // Expandir - reconstruir painel completo
            controlPanel.style.transition = 'all 0.3s ease';
            controlPanel.style.padding = '18px';
            controlPanel.style.maxWidth = '300px';
            controlPanel.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(40,40,40,0.95))';
            controlPanel.style.borderRadius = '12px';
            
            controlPanel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid rgba(255,255,255,0.15); padding-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 17px; font-weight: 600; background: linear-gradient(135deg, #ffffff, #aaaaaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">🌌 Black & White Holes</h3>
                    <button id="holesMinimizeBtn" style="
                        background: linear-gradient(180deg, #000 0%, #000 48%, #fff 52%, #fff 100%);
                        border: 2px solid rgba(255,255,255,0.3);
                        width: 42px;
                        height: 42px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 22px;
                        font-weight: bold;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.2);
                    " onmouseover="this.style.transform='scale(1.15) rotate(180deg)'" onmouseout="this.style.transform='scale(1) rotate(0deg)'">
                        <span style="
                            background: linear-gradient(180deg, #fff 0%, #fff 48%, #000 52%, #000 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            font-size: 24px;
                            font-weight: bold;
                        ">B</span>
                    </button>
                </div>
                
                <div id="holesContent">
                    <!-- BLACK HOLE SECTION -->
                    <div style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 10px; margin-bottom: 14px; border-left: 4px solid #000; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">⚫ Black Hole</h4>
                        
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; opacity: 0.9;">
                            Pull Distance: <span id="bhDistanceValue" style="color: #4CAF50; font-weight: bold;">${blackHolePullDistance}</span>px
                        </label>
                        <input type="range" id="bhDistanceSlider" 
                               min="10" max="80" value="${blackHolePullDistance}" 
                               style="width: 100%; cursor: pointer; margin-bottom: 10px; accent-color: #000;">
                        
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; opacity: 0.9;">
                            Pull Speed: <span id="bhSpeedValue" style="color: #2196F3; font-weight: bold;">${blackHolePullSpeed}</span>
                        </label>
                        <input type="range" id="bhSpeedSlider" 
                               min="1" max="10" value="${blackHolePullSpeed}" 
                               style="width: 100%; cursor: pointer; margin-bottom: 10px; accent-color: #000;">
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
                            <label style="display: flex; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                <input type="checkbox" id="bhOrbitToggle" ${blackHoleOrbitMode ? 'checked' : ''} style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                                🌀 Orbit
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                <input type="checkbox" id="bhVisualDeletionToggle" ${blackHoleVisualDeletion ? 'checked' : ''} style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                                🔥 Visual Del
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                <input type="checkbox" id="bhGravityWavesToggle" ${blackHoleGravityWaves ? 'checked' : ''} style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                                🌊 Waves
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                <input type="checkbox" id="bhParticlesToggle" ${blackHoleParticlesEnabled ? 'checked' : ''} style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                                ✨ Particles
                            </label>
                        </div>
                    </div>
                    
                    <!-- WHITE HOLE SECTION -->
                    <div style="background: rgba(255,255,255,0.12); padding: 14px; border-radius: 10px; margin-bottom: 14px; border-left: 4px solid #fff; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                        <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">⚪ White Hole</h4>
                        
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; opacity: 0.9;">
                            Push Distance: <span id="whDistanceValue" style="color: #FF9800; font-weight: bold;">${whiteHolePushDistance}</span>px
                        </label>
                        <input type="range" id="whDistanceSlider" 
                               min="10" max="80" value="${whiteHolePushDistance}" 
                               style="width: 100%; cursor: pointer; margin-bottom: 10px; accent-color: #fff;">
                        
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; opacity: 0.9;">
                            Push Speed: <span id="whSpeedValue" style="color: #E91E63; font-weight: bold;">${whiteHolePushSpeed}</span>
                        </label>
                        <input type="range" id="whSpeedSlider" 
                               min="1" max="10" value="${whiteHolePushSpeed}" 
                               style="width: 100%; cursor: pointer; margin-bottom: 10px; accent-color: #fff;">
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
                            <label style="display: flex; align-items: center; cursor: pointer; background: rgba(0,0,0,0.1); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
                                <input type="checkbox" id="whOrbitToggle" ${whiteHoleOrbitMode ? 'checked' : ''} style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                                🌀 Orbit
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; background: rgba(0,0,0,0.1); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
                                <input type="checkbox" id="whCreationToggle" ${whiteHoleCreationEffect ? 'checked' : ''} style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                                ✨ Creation
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; background: rgba(0,0,0,0.1); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
                                <input type="checkbox" id="whGravityWavesToggle" ${whiteHoleGravityWaves ? 'checked' : ''} style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                                🌊 Waves
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; background: rgba(0,0,0,0.1); padding: 6px 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
                                <input type="checkbox" id="whParticlesToggle" ${whiteHoleParticlesEnabled ? 'checked' : ''} style="margin-right: 6px; cursor: pointer; width: 14px; height: 14px;">
                                💫 Particles
                            </label>
                        </div>
                    </div>
                    
                    <!-- INTERACTION SECTION -->
                    <div style="background: linear-gradient(90deg, rgba(0,0,0,0.3), rgba(255,255,255,0.2)); padding: 12px; border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                        <label style="display: flex; align-items: center; font-size: 12px; cursor: pointer; font-weight: 600;">
                            <input type="checkbox" id="interactionToggle" ${interactionParticles ? 'checked' : ''} style="margin-right: 8px; cursor: pointer; width: 16px; height: 16px;">
                            ⚡ Interaction Particles
                        </label>
                        <div style="font-size: 10px; margin-top: 5px; opacity: 0.8; font-style: italic;">
                            When holes are near each other
                        </div>
                    </div>
                </div>
            `;
            
            // Reconectar listeners
            setupEventListeners();
            document.getElementById('holesMinimizeBtn').addEventListener('click', toggleMinimize);
        }
    }
    
    // Configurar event listeners inicialmente
    setupEventListeners();
    
    // Adicionar listener ao botão de minimizar
    document.getElementById('holesMinimizeBtn').addEventListener('click', toggleMinimize);
}

console.log("🌌 Mod de Buracos Negro e Branco carregado! Use as ferramentas para criar buracos negros e brancos.");