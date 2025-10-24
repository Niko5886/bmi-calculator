// ==================== МОДУЛ ЗА ВАЛИДАЦИЯ ====================
const ValidationModule = {
    /**
     * Валидира входните данни
     * @param {Object} data - Обект с входните данни
     * @returns {Object} - {valid: boolean, errors: Array}
     */
    validateInput(data) {
        const errors = [];

        // Проверка на измеренията на пода
        if (!data.floorWidth || data.floorWidth <= 0) {
            errors.push('Въведете валидна ширина на пода');
        }
        if (!data.floorLength || data.floorLength <= 0) {
            errors.push('Въведете валидна дължина на пода');
        }

        // Проверка на плочките за под
        if (!data.floorTileWidth || data.floorTileWidth <= 0) {
            errors.push('Въведете валидна ширина на плочките за под');
        }
        if (!data.floorTileLength || data.floorTileLength <= 0) {
            errors.push('Въведете валидна дължина на плочките за под');
        }

        // Проверка на измеренията на стените
        if (!data.wallHeight || data.wallHeight <= 0) {
            errors.push('Въведете валидна височина на стените');
        }

        // Проверка на плочките за стени
        if (!data.wallTileWidth || data.wallTileWidth <= 0) {
            errors.push('Въведете валидна ширина на плочките за стени');
        }
        if (!data.wallTileHeight || data.wallTileHeight <= 0) {
            errors.push('Въведете валидна височина на плочките за стени');
        }

        // Проверка на вратата
        if (!data.doorWidth || data.doorWidth <= 0) {
            errors.push('Въведете валидна ширина на вратата');
        }
        if (!data.doorHeight || data.doorHeight <= 0) {
            errors.push('Въведете валидна височина на вратата');
        }

        // Логически проверки
        if (data.doorWidth > data.floorWidth) {
            errors.push('Вратата не може да бъде по-широка от банята');
        }
        if (data.doorHeight > data.wallHeight) {
            errors.push('Вратата не може да бъде по-висока от стените');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
};

// ==================== МОДУЛ ЗА ИЗЧИСЛЕНИЯ ====================
const CalculationModule = {
    WASTE_FACTOR: 1.10, // 10% отпадък

    /**
     * Изчислява броя плочки за под
     * @param {number} width - Ширина на пода (мм)
     * @param {number} length - Дължина на пода (мм)
     * @param {number} tileWidth - Ширина на плочката (мм)
     * @param {number} tileLength - Дължина на плочката (мм)
     * @returns {Object} - {tiles: number, area: number, tileArea: number}
     */
    calculateFloorTiles(width, length, tileWidth, tileLength) {
        // Площ на пода в кв.м
        const floorArea = (width * length) / 1000000;
        
        // Площ на една плочка в кв.м
        const tileArea = (tileWidth * tileLength) / 1000000;
        
        // Брой плочки без отпадък
        const tilesNeeded = Math.ceil(floorArea / tileArea);
        
        // Брой плочки с отпадък
        const tilesWithWaste = Math.ceil(tilesNeeded * this.WASTE_FACTOR);

        return {
            tiles: tilesWithWaste,
            area: floorArea,
            tileArea: tileArea,
            tilesNoWaste: tilesNeeded
        };
    },

    /**
     * Изчислява броя плочки за стени
     * @param {number} width - Ширина на пода (мм)
     * @param {number} length - Дължина на пода (мм)
     * @param {number} height - Височина на стените (мм)
     * @param {number} tileWidth - Ширина на плочката (мм)
     * @param {number} tileHeight - Височина на плочката (мм)
     * @param {number} doorWidth - Ширина на вратата (мм)
     * @param {number} doorHeight - Височина на вратата (мм)
     * @returns {Object}
     */
    calculateWallTiles(width, length, height, tileWidth, tileHeight, doorWidth, doorHeight) {
        // Обща площ на четирите стени в кв.м
        const perimeter = 2 * (width + length);
        const totalWallArea = (perimeter * height) / 1000000;
        
        // Площ на вратата в кв.м
        const doorArea = (doorWidth * doorHeight) / 1000000;
        
        // Нетна площ за облицоване
        const netWallArea = totalWallArea - doorArea;
        
        // Площ на една плочка в кв.м
        const tileArea = (tileWidth * tileHeight) / 1000000;
        
        // Брой плочки без отпадък
        const tilesNeeded = Math.ceil(netWallArea / tileArea);
        
        // Брой плочки с отпадък
        const tilesWithWaste = Math.ceil(tilesNeeded * this.WASTE_FACTOR);

        return {
            tiles: tilesWithWaste,
            area: netWallArea,
            totalArea: totalWallArea,
            doorArea: doorArea,
            tileArea: tileArea,
            tilesNoWaste: tilesNeeded
        };
    },

    /**
     * Изчислява детайли за отделните стени
     */
    calculateIndividualWalls(width, length, height, tileWidth, tileHeight, doorWidth, doorHeight) {
        const tileArea = (tileWidth * tileHeight) / 1000000;
        
        // Стена 1 и 3 (по дължината)
        const wall1Area = (length * height) / 1000000;
        const wall1Tiles = Math.ceil(wall1Area / tileArea);
        
        // Стена 2 (по ширината, без врата)
        const wall2Area = (width * height) / 1000000;
        const wall2Tiles = Math.ceil(wall2Area / tileArea);
        
        // Стена 4 (по ширината, с врата)
        const doorArea = (doorWidth * doorHeight) / 1000000;
        const wall4Area = wall2Area - doorArea;
        const wall4Tiles = Math.ceil(wall4Area / tileArea);

        return {
            wall1: { area: wall1Area, tiles: wall1Tiles, width: length, height: height },
            wall2: { area: wall2Area, tiles: wall2Tiles, width: width, height: height },
            wall3: { area: wall1Area, tiles: wall1Tiles, width: length, height: height },
            wall4: { area: wall4Area, tiles: wall4Tiles, width: width, height: height, hasDoor: true }
        };
    }
};

// ==================== МОДУЛ ЗА ВИЗУАЛИЗАЦИЯ ====================
const VisualizationModule = {
    /**
     * Рисува пода с плочки
     */
    drawFloor(canvasId, floorWidth, floorLength, tileWidth, tileLength) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        
        // Задаване на размер на canvas
        const maxCanvasSize = 500;
        const scale = Math.min(maxCanvasSize / floorWidth, maxCanvasSize / floorLength);
        
        canvas.width = floorWidth * scale;
        canvas.height = floorLength * scale;
        
        // Фон
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рамка на пода
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Рисуване на плочките
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 1;
        
        const scaledTileWidth = tileWidth * scale;
        const scaledTileLength = tileLength * scale;
        
        // Вертикални линии
        for (let x = scaledTileWidth; x < canvas.width; x += scaledTileWidth) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Хоризонтални линии
        for (let y = scaledTileLength; y < canvas.height; y += scaledTileLength) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Шарка на плочките
        ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        let alternate = false;
        for (let y = 0; y < canvas.height; y += scaledTileLength) {
            for (let x = 0; x < canvas.width; x += scaledTileWidth) {
                if (alternate) {
                    ctx.fillRect(x, y, scaledTileWidth, scaledTileLength);
                }
                alternate = !alternate;
            }
        }
    },

    /**
     * Рисува стена с плочки
     */
    drawWall(canvasId, wallWidth, wallHeight, tileWidth, tileHeight, hasDoor = false, doorWidth = 0, doorHeight = 0) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        
        // Задаване на размер на canvas
        const maxCanvasSize = 400;
        const scale = Math.min(maxCanvasSize / wallWidth, maxCanvasSize / wallHeight);
        
        canvas.width = wallWidth * scale;
        canvas.height = wallHeight * scale;
        
        // Фон
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рамка на стената
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Рисуване на плочките
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 1;
        
        const scaledTileWidth = tileWidth * scale;
        const scaledTileHeight = tileHeight * scale;
        
        // Вертикални линии
        for (let x = scaledTileWidth; x < canvas.width; x += scaledTileWidth) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Хоризонтални линии
        for (let y = scaledTileHeight; y < canvas.height; y += scaledTileHeight) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Шарка на плочките
        ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
        let alternate = false;
        for (let y = 0; y < canvas.height; y += scaledTileHeight) {
            for (let x = 0; x < canvas.width; x += scaledTileWidth) {
                if (alternate) {
                    ctx.fillRect(x, y, scaledTileWidth, scaledTileHeight);
                }
                alternate = !alternate;
            }
        }
        
        // Рисуване на врата (ако има)
        if (hasDoor) {
            const scaledDoorWidth = doorWidth * scale;
            const scaledDoorHeight = doorHeight * scale;
            const doorX = (canvas.width - scaledDoorWidth) / 2;
            const doorY = canvas.height - scaledDoorHeight;
            
            // Врата
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(doorX, doorY, scaledDoorWidth, scaledDoorHeight);
            
            // Рамка на вратата
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.strokeRect(doorX, doorY, scaledDoorWidth, scaledDoorHeight);
            
            // Дръжка
            ctx.fillStyle = '#c0c0c0';
            ctx.beginPath();
            ctx.arc(doorX + scaledDoorWidth * 0.8, doorY + scaledDoorHeight * 0.5, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// ==================== МОДУЛ ЗА ПОТРЕБИТЕЛСКИ ИНТЕРФЕЙС ====================
const UIModule = {
    /**
     * Показва резултатите
     */
    displayResults(floorResult, wallResult, totalTiles) {
        document.getElementById('floorTilesResult').textContent = floorResult.tiles;
        document.getElementById('floorAreaResult').textContent = 
            `Площ: ${floorResult.area.toFixed(2)} м²`;
        
        document.getElementById('wallTilesResult').textContent = wallResult.tiles;
        document.getElementById('wallAreaResult').textContent = 
            `Площ: ${wallResult.area.toFixed(2)} м² (от ${wallResult.totalArea.toFixed(2)} м²)`;
        
        document.getElementById('totalTilesResult').textContent = totalTiles;
        
        // Показване на секциите
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('visualizationSection').style.display = 'block';
        
        // Плавно скролване до резултатите
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    },

    /**
     * Показва етикети за визуализациите
     */
    displayVisualizationLabels(floorData, wallData) {
        document.getElementById('floorLabel').textContent = 
            `${floorData.width} × ${floorData.length} мм | Плочки: ${floorData.tileWidth} × ${floorData.tileLength} мм`;
        
        document.getElementById('wall1Label').textContent = 
            `${wallData.wall1.width} × ${wallData.wall1.height} мм | ${wallData.wall1.tiles} плочки`;
        
        document.getElementById('wall2Label').textContent = 
            `${wallData.wall2.width} × ${wallData.wall2.height} мм | ${wallData.wall2.tiles} плочки`;
        
        document.getElementById('wall3Label').textContent = 
            `${wallData.wall3.width} × ${wallData.wall3.height} мм | ${wallData.wall3.tiles} плочки`;
        
        document.getElementById('wall4Label').textContent = 
            `${wallData.wall4.width} × ${wallData.wall4.height} мм | ${wallData.wall4.tiles} плочки (с врата)`;
    },

    /**
     * Показва грешки
     */
    showErrors(errors) {
        alert('Моля, коригирайте следните грешки:\n\n' + errors.join('\n'));
    }
};

// ==================== ГЛАВЕН КОНТРОЛЕР ====================
const AppController = {
    /**
     * Инициализация на приложението
     */
    init() {
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.handleCalculation();
        });

        // Добавяне на Enter key support
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleCalculation();
                }
            });
        });
    },

    /**
     * Събиране на входните данни
     */
    getInputData() {
        return {
            floorWidth: parseFloat(document.getElementById('floorWidth').value),
            floorLength: parseFloat(document.getElementById('floorLength').value),
            floorTileWidth: parseFloat(document.getElementById('floorTileWidth').value),
            floorTileLength: parseFloat(document.getElementById('floorTileLength').value),
            wallHeight: parseFloat(document.getElementById('wallHeight').value),
            wallTileWidth: parseFloat(document.getElementById('wallTileWidth').value),
            wallTileHeight: parseFloat(document.getElementById('wallTileHeight').value),
            doorWidth: parseFloat(document.getElementById('doorWidth').value),
            doorHeight: parseFloat(document.getElementById('doorHeight').value)
        };
    },

    /**
     * Обработка на изчислението
     */
    handleCalculation() {
        const data = this.getInputData();
        
        // Валидация
        const validation = ValidationModule.validateInput(data);
        if (!validation.valid) {
            UIModule.showErrors(validation.errors);
            return;
        }

        // Изчисления
        const floorResult = CalculationModule.calculateFloorTiles(
            data.floorWidth,
            data.floorLength,
            data.floorTileWidth,
            data.floorTileLength
        );

        const wallResult = CalculationModule.calculateWallTiles(
            data.floorWidth,
            data.floorLength,
            data.wallHeight,
            data.wallTileWidth,
            data.wallTileHeight,
            data.doorWidth,
            data.doorHeight
        );

        const individualWalls = CalculationModule.calculateIndividualWalls(
            data.floorWidth,
            data.floorLength,
            data.wallHeight,
            data.wallTileWidth,
            data.wallTileHeight,
            data.doorWidth,
            data.doorHeight
        );

        const totalTiles = floorResult.tiles + wallResult.tiles;

        // Показване на резултати
        UIModule.displayResults(floorResult, wallResult, totalTiles);

        // Визуализация
        VisualizationModule.drawFloor(
            'floorCanvas',
            data.floorWidth,
            data.floorLength,
            data.floorTileWidth,
            data.floorTileLength
        );

        VisualizationModule.drawWall(
            'wall1Canvas',
            data.floorLength,
            data.wallHeight,
            data.wallTileWidth,
            data.wallTileHeight
        );

        VisualizationModule.drawWall(
            'wall2Canvas',
            data.floorWidth,
            data.wallHeight,
            data.wallTileWidth,
            data.wallTileHeight
        );

        VisualizationModule.drawWall(
            'wall3Canvas',
            data.floorLength,
            data.wallHeight,
            data.wallTileWidth,
            data.wallTileHeight
        );

        VisualizationModule.drawWall(
            'wall4Canvas',
            data.floorWidth,
            data.wallHeight,
            data.wallTileWidth,
            data.wallTileHeight,
            true,
            data.doorWidth,
            data.doorHeight
        );

        // Етикети
        UIModule.displayVisualizationLabels(
            {
                width: data.floorWidth,
                length: data.floorLength,
                tileWidth: data.floorTileWidth,
                tileLength: data.floorTileLength
            },
            individualWalls
        );
    }
};

// Стартиране на приложението при зареждане
document.addEventListener('DOMContentLoaded', () => {
    AppController.init();
});
