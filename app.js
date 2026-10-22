/**
 * ============================================================
 * YÖRÜNGE TAKİP - CANLI UYDU & STARLINK TAKİP SİSTEMİ (APP.JS)
 * ============================================================
 * 
 * Özellikler:
 * 1. Google Maps / Uydu / Gece harita modları.
 * 2. Anlık canlı konum, hız (km/s, km/h) ve rota yönü.
 * 3. Bütün uydularda 24 saatlik tam gün yörünge izi (nereden geçti, nereye gidecek).
 * 4. Sabit uydular (Türksat vb.) için günlük kapsama alanı ve yörünge yayı.
 * 5. Canlı hareketi izlemek için hızlandırılmış simülasyon (1x, 10x, 60x).
 * 6. Otomatik kamera takibi (Kamerayı uydunun peşinden kaydırma).
 */

// --- 1. GLOBAL DEĞİŞKENLER ---
let currentSatellite = null;    // Şu an takip edilen uydu objesi
let currentSatrec = null;       // satellite.js tarafından işlenen yörünge kaydı
let map = null;                 // Leaflet harita nesnesi
let satelliteMarker = null;     // Haritadaki uydu ikonu (radar)
let orbitLayerGroup = null;     // Uydunun o günkü rotasını (geçmiş + gelecek) saklayan katman
let liveTimer = null;           // Her saniye çalışan ana zamanlayıcı
let isOrbitVisible = true;      // Yörünge izi açık mı kapalı mı?
let isAutoFollow = true;        // Kameranın uyduyu otomatik takip etme durumu (varsayılan açık)
let currentMapMode = "streets"; // "streets" (Google Harita), "hybrid" (Google Uydu), "dark" (Gece Modu)
let simDate = new Date();       // Canlı zaman



// Harita Katmanları: Google Maps ve Gece Haritası
let googleStreetsLayer = null;
let googleHybridLayer = null;
let darkTileLayer = null;

// --- 2. SAYFA YÜKLENDİĞİNDE BAŞLAT ---
document.addEventListener("DOMContentLoaded", () => {
    initMap();          // Haritayı hazırla
    initClock();        // Ortalı canlı UTC saatini başlat
    initEvents();       // Arama, buton ve hız kontrollerini bağla
    
    // Varsayılan olarak ilk Starlink uydusu ile başla
    if (typeof POPULAR_SATELLITES !== "undefined" && POPULAR_SATELLITES.length > 0) {
        selectSatellite(POPULAR_SATELLITES[0]);
    }
});

// --- 3. HARİTAYI BAŞLATMA (LEAFLET JS & GOOGLE MAPS) ---
function initMap() {
    map = L.map("satelliteMap", {
        center: [20, 0],
        zoom: 2.5,
        minZoom: 1.8,
        maxZoom: 18,
        worldCopyJump: true
    });

    // 1. Google Maps Klasik Sokak & Şehir Haritası (Yollar, Ülkeler, Şehirler, Denizler)
    googleStreetsLayer = L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: '&copy; Google Maps & Yörünge Takip'
    });

    // 2. Google Maps Hibrit (Gerçek Dünya Uydu Fotoğrafları + Şehir & Ülke Sınırları)
    googleHybridLayer = L.tileLayer("https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: '&copy; Google Maps Uydu'
    });

    // 3. Koyu Uzay Temalı Gece Haritası
    darkTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; CARTO Dark',
        subdomains: "abcd",
        maxZoom: 19
    });

    // Google Harita'yı varsayılan olarak yükle
    googleStreetsLayer.addTo(map);

    // Harita üzerindeki yanıp sönen radar ikonunu oluşturur
    const radarIcon = L.divIcon({
        className: "sat-custom-marker",
        html: `
            <div class="radar-marker">
                <div class="radar-ring"></div>
                <div class="radar-ring radar-ring-2"></div>
                <div class="radar-core">🛰️</div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    satelliteMarker = L.marker([0, 0], { icon: radarIcon }).addTo(map);

    // Gün boyunca nereden geçtiğini ve nereye gideceğini saklayan katman grubu
    orbitLayerGroup = L.layerGroup().addTo(map);
}

// --- 4. UYDUDAN ANLIK KOORDİNAT VE HIZ HESAPLAMA (SATELLITE.JS) ---
function calculatePositionAndSpeed(satrec, date) {
    if (!satrec) return null;
    try {
        const positionAndVelocity = satellite.propagate(satrec, date);
        if (!positionAndVelocity || !positionAndVelocity.position || !positionAndVelocity.velocity) {
            return null;
        }

        const gmst = satellite.gstime(date);
        const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

        const latitude = satellite.degreesLat(positionGd.latitude);
        const longitude = satellite.degreesLong(positionGd.longitude);
        const altitude = positionGd.height;

        const vel = positionAndVelocity.velocity;
        const speedKmS = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        const speedKmH = speedKmS * 3600;

        return {
            lat: latitude,
            lng: longitude,
            alt: altitude,
            speedKmS: speedKmS,
            speedKmH: speedKmH
        };
    } catch (err) {
        return null;
    }
}

// --- 5. UYDUNUN NEREYE GİTTİĞİNİ (ROTA VE PUSULA AÇISINI) HESAPLAMA ---
function calculateHeading(currentPos, satrec, currentDate) {
    const futureDate = new Date(currentDate.getTime() + 60 * 1000);
    const futurePos = calculatePositionAndSpeed(satrec, futureDate);
    if (!futurePos) return { angle: 0, directionText: "Bilinmiyor" };

    const lat1 = currentPos.lat * Math.PI / 180;
    const lat2 = futurePos.lat * Math.PI / 180;
    const dLng = (futurePos.lng - currentPos.lng) * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;

    const directions = [
        "Kuzey", "Kuzey-Doğu", "Doğu", "Güney-Doğu",
        "Güney", "Güney-Batı", "Batı", "Kuzey-Batı"
    ];
    const index = Math.round(bearing / 45) % 8;
    const directionText = directions[index];

    return {
        angle: Math.round(bearing),
        directionText: directionText
    };
}

// 180 derece boylam geçişlerinde haritada yatay düz çizgi oluşmasını engelleyen bölücü
function splitAntimeridian(points) {
    const segments = [];
    let currentSegment = [];
    for (let i = 0; i < points.length; i++) {
        if (currentSegment.length > 0) {
            const prev = currentSegment[currentSegment.length - 1];
            const curr = points[i];
            if (Math.abs(curr[1] - prev[1]) > 180) {
                segments.push(currentSegment);
                currentSegment = [];
            }
        }
        currentSegment.push(points[i]);
    }
    if (currentSegment.length > 0) segments.push(currentSegment);
    return segments;
}

// --- 6. TÜM UYDULAR İÇİN GÜN BOYUNCA NEREDEN GEÇTİĞİ VE NEREYE GİDECEĞİ ---
function updateOrbitPath(satrec) {
    if (!orbitLayerGroup) return;
    orbitLayerGroup.clearLayers();
    if (!isOrbitVisible || !satrec) return;

    const now = new Date();
    const currentPos = calculatePositionAndSpeed(satrec, now);
    if (!currentPos) return;

    // 1. DURUM: SABİT JEOSENKRON UYDULAR (Türksat 4A, 5A, 5B, 6A vb. irtifa > 30.000 km)
    // 35.786 km irtifadan Dünya yüzeyinde yaklaşık 7.000 km yarıçapında devasa bir alanı kapsar
    if (currentPos.alt > 30000) {
        // Alt bilgi çubuğundaki lejantı sabit uyduya göre uyarla
        const legendEl = document.getElementById("hudOrbitLegend");
        if (legendEl) {
            legendEl.innerHTML = `
                <span class="sum-label" style="color: #ff9100; font-weight: 700;">🟠 Kapsama Alanı (Footprint)</span>
                <span class="sum-label" style="color: #ffb703; font-weight: 700; margin-left: 10px;">🟡 Sabit Jeosenkron Yörünge</span>
            `;
        }

        // A) Sabit Uydunun Küresel Kapsama Alanı Dairesi
        const coverageCircle = L.circle([currentPos.lat, currentPos.lng], {
            radius: 6800000,
            color: "#ff9100",
            weight: 2,
            fillColor: "#ff9100",
            fillOpacity: 0.12,
            dashArray: "8, 6"
        });
        coverageCircle.bindTooltip("🌐 <strong>Küresel Kapsama Alanı (Footprint)</strong>", { sticky: true });
        orbitLayerGroup.addLayer(coverageCircle);

        // B) Ekvator Üzerindeki Jeosenkron Yörünge Kuşağı (Clarke Kuşağı)
        const equatorArc = L.polyline([
            [0, currentPos.lng - 45],
            [0, currentPos.lng + 45]
        ], {
            color: "#ffb703",
            weight: 2.5,
            dashArray: "8, 6"
        });
        equatorArc.bindTooltip("🌍 <strong>Ekvator Sabit Yörünge Kuşağı (Clarke Kuşağı)</strong>", { sticky: true });
        orbitLayerGroup.addLayer(equatorArc);

        return;
    } else {
        const legendEl = document.getElementById("hudOrbitLegend");
        if (legendEl) {
            legendEl.innerHTML = `
                <span class="sum-label" style="color: #ff9100; font-weight: 700;">🟠 Önceden Geçtiği Yol</span>
                <span class="sum-label" style="color: #ff2a6d; font-weight: 700; margin-left: 10px;">🔴 Gideceği Yol</span>
            `;
        }
    }

    // 2. DURUM: ALÇAK VE ORTA YÖRÜNGE UYDULARI (Starlink, ISS, Göktürk, Hubble, GPS vb.)
    // O gün nereden geçtiği (Geçmiş 12 saat) ve o gün nereye gideceği (Gelecek 12 saat)
    const pastPoints = [];
    const futurePoints = [];

    // Geçmiş 12 saat (O gün boyunca nereden geçti?) - Her 3 dakikada bir hesapla
    for (let m = -720; m <= 0; m += 3) {
        const time = new Date(now.getTime() + m * 60 * 1000);
        const p = calculatePositionAndSpeed(satrec, time);
        if (p) pastPoints.push([p.lat, p.lng]);
    }

    // Gelecek 12 saat (O gün boyunca nereye gidecek?) - Her 3 dakikada bir hesapla
    for (let m = 0; m <= 720; m += 3) {
        const time = new Date(now.getTime() + m * 60 * 1000);
        const p = calculatePositionAndSpeed(satrec, time);
        if (p) futurePoints.push([p.lat, p.lng]);
    }

    // Antimeridyen geçişlerini bölerek temiz çizgiler oluştur
    const pastSegments = splitAntimeridian(pastPoints);
    const futureSegments = splitAntimeridian(futurePoints);

    // Geçmiş Yörünge İzi (O gün nereden geçti? - Canlı Turuncu Kesikli Çizgi)
    const pastPolyline = L.polyline(pastSegments, {
        color: "#ff7700", // Canlı Turuncu (önceden geçtiği yerler)
        weight: 3,
        opacity: 0.9,
        dashArray: "6, 6"
    });
    orbitLayerGroup.addLayer(pastPolyline);

    // Gelecek Yörünge İzi (O gün nereye gidecek? - Parlak Pembe Kesikli Çizgi)
    const futurePolyline = L.polyline(futureSegments, {
        color: "#ff2a6d",
        weight: 3,
        opacity: 0.9,
        dashArray: "8, 6"
    });
    orbitLayerGroup.addLayer(futurePolyline);
}

// --- 7. HER SANİYE CANLI TELEMETRİ GÜNCELLEMESİ ---
function updateLiveTelemetry() {
    if (!currentSatrec || !currentSatellite) return;

    // Gerçek canlı zaman
    simDate = new Date();

    const pos = calculatePositionAndSpeed(currentSatrec, simDate);
    if (!pos) return;

    // 1. Haritadaki uydunun yerini güncelle (canlı hareket)
    satelliteMarker.setLatLng([pos.lat, pos.lng]);

    // Otomatik Takip: Kamera uydunun ekranın dışına kaçmasını engeller.
    // Ancak her an kamerayı uydunun tam merkezine kilitlemez; böylece uydu harita üzerinde ilerlerken gözle görülür.
    if (isAutoFollow && pos.alt < 30000 && map) {
        const bounds = map.getBounds();
        const innerBounds = bounds.pad(-0.25);
        if (!innerBounds.contains([pos.lat, pos.lng])) {
            map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.8 });
        }
    }

    // 2. Yön ve Rota hesapla (Uydunun nereye gittiği)
    const heading = calculateHeading(pos, currentSatrec, simDate);

    // 3. Bölge adını tespit et
    const regionName = detectRegion(pos.lat, pos.lng);

    // 4. Arayüz Elemanlarını Güncelle
    document.getElementById("valLatitude").textContent = `${pos.lat.toFixed(4)}°`;
    document.getElementById("valLatitudeDMS").textContent = pos.lat >= 0 ? `${pos.lat.toFixed(2)}° Kuzey` : `${Math.abs(pos.lat).toFixed(2)}° Güney`;

    document.getElementById("valLongitude").textContent = `${pos.lng.toFixed(4)}°`;
    document.getElementById("valLongitudeDMS").textContent = pos.lng >= 0 ? `${pos.lng.toFixed(2)}° Doğu` : `${Math.abs(pos.lng).toFixed(2)}° Batı`;

    // Hız Değerleri (Sabit uydular Dünya ile senkron döndüğü için yere göre hızı 0 km/h'dir)
    if (pos.alt > 30000) {
        document.getElementById("valSpeedKmh").textContent = "0 km/h (Yere Göre Sabit)";
        document.getElementById("valSpeedKms").textContent = "3.07 km/s (Yörünge Hızı)";
        document.getElementById("hudSpeed").textContent = "0 km/h (Dünya ile Sabit)";

        // Yön ve Rota Değerleri
        document.getElementById("valHeading").textContent = "0° (Ekvator)";
        document.getElementById("valCompassText").textContent = "Sabit Konum (GEO)";
        document.getElementById("hudHeadingDeg").textContent = "Sabit Yörünge";

        // Hareket Özeti
        document.getElementById("motionSpeedVal").textContent = "0 km/h (Yere Göre)";
        document.getElementById("motionDirectionSummary").innerHTML = 
            `<strong>Sabit Jeosenkron Yörünge (GEO):</strong> Dünya kendi ekseninde 24 saatte bir dönerken bu uydu da Dünya ile <em>birebir aynı hızda</em> döner. Bu yüzden haritada hep sabit kalır ve çatılardaki çanak antenler hiç oynamadan 24 saat yayın alır.`;
    } else {
        document.getElementById("valSpeedKmh").textContent = `${Math.round(pos.speedKmH).toLocaleString("tr-TR")} km/h`;
        document.getElementById("valSpeedKms").textContent = `${pos.speedKmS.toFixed(2)} km/saniye`;
        document.getElementById("hudSpeed").textContent = `${Math.round(pos.speedKmH).toLocaleString("tr-TR")} km/h`;

        // Yön ve Rota Değerleri
        document.getElementById("valHeading").textContent = `${heading.angle}°`;
        document.getElementById("valCompassText").textContent = heading.directionText;
        document.getElementById("hudHeadingDeg").textContent = `${heading.angle}° ${heading.directionText}`;

        // Hareket Özeti
        document.getElementById("motionSpeedVal").textContent = `${Math.round(pos.speedKmH).toLocaleString("tr-TR")} km/h`;
        document.getElementById("motionDirectionSummary").innerHTML = 
            `<strong>${heading.directionText} (${heading.angle}°)</strong> yönüne doğru <strong>${Math.round(pos.speedKmH).toLocaleString("tr-TR")} km/h</strong> hızla ilerliyor.`;
    }

    // Yükseklik Değerleri
    document.getElementById("valAltitude").textContent = `${pos.alt.toFixed(1)} km`;
    document.getElementById("hudAltitude").textContent = `${pos.alt.toFixed(1)} km`;

    // Pusula İğnesini Döndür
    const needle = document.getElementById("compassNeedle");
    if (needle) {
        needle.style.transform = pos.alt > 30000 ? `rotate(0deg)` : `rotate(${heading.angle}deg)`;
    }

    document.getElementById("currentRegionText").textContent = regionName;

    // Yörünge Periyodu (Dakika)
    const periodMinutes = calculateOrbitalPeriod(pos.alt);
    document.getElementById("valPeriod").textContent = `${periodMinutes.toFixed(1)} dk`;

    // Güneş Aydınlatması Durumu
    const isDay = checkIsDaylight(pos.lat, pos.lng, simDate);
    document.getElementById("valSunlight").textContent = isDay ? "☀️ Güneş Işığında (Gündüz)" : "🌑 Dünya Gölgesinde (Gece)";
}

// --- 8. YENİ UYDU SEÇME FONKSİYONU ---
function selectSatellite(satData) {
    if (!satData || !satData.tleLine1 || !satData.tleLine2) return;

    currentSatellite = satData;

    // 1. TLE metninden yörünge kaydını (satrec) oluşturur
    currentSatrec = satellite.twoline2satrec(satData.tleLine1, satData.tleLine2);

    // 2. Başlık ve açıklama alanlarını doldurur
    document.getElementById("activeSatHeaderTitle").textContent = satData.name;
    document.getElementById("telemetrySatName").textContent = satData.name;
    document.getElementById("telemetryCategoryBadge").textContent = satData.categoryName || "Yörünge Uydusu";
    document.getElementById("telemetrySatDesc").textContent = satData.description || "Aktif yörünge uydusu.";
    document.getElementById("valNoradId").textContent = satData.noradId || "---";
    document.getElementById("valOperator").textContent = satData.operator || "Bilinmiyor";

    // Referans zamanı mevcut ana ayarla
    simDate = new Date();

    // 3. İlk telemetriyi hemen hesapla
    const pos = calculatePositionAndSpeed(currentSatrec, simDate);
    if (pos) {
        const targetZoom = pos.alt > 30000 ? 3 : 3.2;
        map.flyTo([pos.lat, pos.lng], targetZoom, { duration: 1.2 });
        satelliteMarker.setLatLng([pos.lat, pos.lng]);
        const statusEl = document.getElementById("targetStatusText");
        if (statusEl) {
            statusEl.textContent = pos.alt > 30000 ? "🎯 SABİT YÖRÜNGE (GEO)" : "🎯 HEDEF SEÇİLDİ";
        }
    }

    // 4. Gün boyu nereden geçtiğini ve gideceği yolları haritaya çiz
    updateOrbitPath(currentSatrec);

    // 5. Eski zamanlayıcıyı temizle ve saniyede 4 kez akıcı güncelleyen yeni zamanlayıcı başlat (250ms)
    if (liveTimer) clearInterval(liveTimer);
    updateLiveTelemetry();
    liveTimer = setInterval(updateLiveTelemetry, 250);
}

// --- 9. ARAMA VE FİLTRELEME İŞLEMLERİ ---
function initEvents() {
    const searchInput = document.getElementById("satelliteSearchInput");
    const dropdown = document.getElementById("searchResultsDropdown");
    const clearBtn = document.getElementById("btnClearSearch");
    const onlineSearchBtn = document.getElementById("btnOnlineSearch");

    function normalizeSearch(str) {
        if (!str) return "";
        let s = str
            .toLowerCase()
            .replace(/starling/g, "starlink")
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ı/g, "i")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .replace(/[-_ ]/g, "");
        if (s === "gokturka") s = "gokturk1a";
        return s;
    }

    function performSearch(query) {
        const cleanQuery = normalizeSearch(query);
        if (!cleanQuery) {
            renderSearchResults(POPULAR_SATELLITES);
            return;
        }

        const matches = POPULAR_SATELLITES.filter(s => {
            const nameNorm = normalizeSearch(s.name);
            const noradNorm = normalizeSearch(s.noradId);
            const catNorm = normalizeSearch(s.categoryName);
            const descNorm = normalizeSearch(s.description);
            return nameNorm.includes(cleanQuery) || 
                   noradNorm.includes(cleanQuery) || 
                   catNorm.includes(cleanQuery) ||
                   descNorm.includes(cleanQuery);
        });

        renderSearchResults(matches);
    }

    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        clearBtn.style.display = query.length > 0 ? "flex" : "none";

        if (query.length === 0) {
            dropdown.classList.add("hidden");
            return;
        }

        performSearch(query);
    });

    searchInput.addEventListener("focus", () => {
        const query = searchInput.value.trim();
        performSearch(query);
    });

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const firstResult = dropdown.querySelector(".search-dropdown-item");
            if (firstResult) {
                firstResult.click();
            } else {
                const query = searchInput.value.trim();
                if (query) searchCelesTrakLive(query);
            }
        }
    });

    document.addEventListener("click", (e) => {
        const searchContainer = document.querySelector(".search-container");
        if (searchContainer && !searchContainer.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearBtn.style.display = "none";
        dropdown.classList.add("hidden");
        searchInput.focus();
    });

    onlineSearchBtn.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (!query) {
            alert("Lütfen aramak istediğiniz uydunun adını yazın (Örn: STARLINK, TURKSAT, ISS)");
            return;
        }
        searchCelesTrakLive(query);
    });

    const chips = document.querySelectorAll(".category-chips .chip");
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            const category = chip.getAttribute("data-category");
            if (category === "all") {
                renderSearchResults(POPULAR_SATELLITES);
            } else {
                const filtered = POPULAR_SATELLITES.filter(s => s.category === category);
                renderSearchResults(filtered);
            }
            dropdown.classList.remove("hidden");
        });
    });

    // Harita Kontrol Araçları
    document.getElementById("btnCenterSat").addEventListener("click", () => {
        if (satelliteMarker) {
            map.panTo(satelliteMarker.getLatLng(), { animate: true });
        }
    });

    // Otomatik Takip Butonu
    const btnAutoFollow = document.getElementById("btnAutoFollow");
    if (btnAutoFollow) {
        btnAutoFollow.addEventListener("click", function() {
            isAutoFollow = !isAutoFollow;
            this.classList.toggle("active", isAutoFollow);
            if (isAutoFollow && satelliteMarker) {
                map.panTo(satelliteMarker.getLatLng(), { animate: true });
            }
        });
    }

    // Günlük Yörünge İzi Aç/Kapat
    document.getElementById("btnToggleOrbit").addEventListener("click", function() {
        isOrbitVisible = !isOrbitVisible;
        this.classList.toggle("active", isOrbitVisible);
        if (currentSatrec) updateOrbitPath(currentSatrec);
    });

    // Google Harita / Uydu / Gece Modu Butonu
    const btnMapStyle = document.getElementById("btnMapStyle");
    if (btnMapStyle) {
        btnMapStyle.textContent = "🗺️ Google Harita";
        btnMapStyle.addEventListener("click", () => {
            if (currentMapMode === "streets") {
                map.removeLayer(googleStreetsLayer);
                googleHybridLayer.addTo(map);
                currentMapMode = "hybrid";
                btnMapStyle.textContent = "🌍 Google Uydu";
            } else if (currentMapMode === "hybrid") {
                map.removeLayer(googleHybridLayer);
                darkTileLayer.addTo(map);
                currentMapMode = "dark";
                btnMapStyle.textContent = "🌌 Gece Modu";
            } else {
                map.removeLayer(darkTileLayer);
                googleStreetsLayer.addTo(map);
                currentMapMode = "streets";
                btnMapStyle.textContent = "🗺️ Google Harita";
            }
        });
    }
}

function renderSearchResults(list) {
    const dropdown = document.getElementById("searchResultsDropdown");
    dropdown.innerHTML = "";

    if (!list || list.length === 0) {
        dropdown.innerHTML = `<div style="padding: 12px; color: #8b9bb4; font-size: 0.85rem;">Eşleşen uydu bulunamadı. "Canlı Ara" butonuna basarak CelesTrak'tan arayabilirsiniz.</div>`;
        dropdown.classList.remove("hidden");
        return;
    }

    list.slice(0, 10).forEach(sat => {
        const item = document.createElement("div");
        item.className = "search-dropdown-item";
        item.innerHTML = `
            <div class="item-left">
                <span class="item-icon">🛰️</span>
                <div>
                    <div class="item-name">${sat.name}</div>
                    <div class="item-desc">${sat.categoryName || sat.operator || ''}</div>
                </div>
            </div>
            <span class="item-badge">${sat.noradId || 'NORAD'}</span>
        `;
        item.addEventListener("click", () => {
            selectSatellite(sat);
            dropdown.classList.add("hidden");
            document.getElementById("satelliteSearchInput").value = sat.name;
        });
        dropdown.appendChild(item);
    });

    dropdown.classList.remove("hidden");
}

async function searchCelesTrakLive(query) {
    const onlineBtn = document.getElementById("btnOnlineSearch");
    const originalText = onlineBtn.textContent;
    onlineBtn.textContent = "⏳ Aranıyor...";
    onlineBtn.disabled = true;

    try {
        const url = `https://celestrak.org/NORAD/elements/gp.php?NAME=${encodeURIComponent(query)}&FORMAT=tle`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Veri çekilemedi");
        
        const text = await response.text();
        const lines = text.trim().split("\n").map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length < 3) {
            alert(`"${query}" aramasına uygun canlı uydu bulunamadı. Farklı bir isim deneyin.`);
            return;
        }

        const foundSatellites = [];
        for (let i = 0; i < lines.length - 2; i += 3) {
            foundSatellites.push({
                name: lines[i],
                noradId: lines[i + 1].substring(2, 7).trim(),
                category: query.toLowerCase().includes("starlink") ? "starlink" : "other",
                categoryName: "Canlı CelesTrak Uydusu",
                operator: "Uluslararası Uzay Kataloğu",
                description: "CelesTrak sunucularından anlık çekilen güncel yörünge verisi.",
                tleLine1: lines[i + 1],
                tleLine2: lines[i + 2]
            });
        }

        renderSearchResults(foundSatellites);
    } catch (err) {
        alert("Canlı arama sırasında bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
        onlineBtn.textContent = originalText;
        onlineBtn.disabled = false;
    }
}

function calculateOrbitalPeriod(altitudeKm) {
    const earthRadiusKm = 6371;
    const r = earthRadiusKm + altitudeKm;
    const GM = 398600.4418;
    const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / GM);
    return periodSeconds / 60;
}

function detectRegion(lat, lng) {
    if (lat >= 35.8 && lat <= 42.2 && lng >= 25.5 && lng <= 44.8) {
        return "🇹🇷 Türkiye Semaları";
    }
    if (lat >= 30 && lat <= 46 && lng >= -6 && lng <= 36) return "Akdeniz & Güney Avrupa";
    if (lat >= 36 && lat <= 70 && lng >= -10 && lng <= 40) return "Avrupa Kıtası";
    if (lat >= 10 && lat <= 55 && lng >= 60 && lng <= 145) return "Asya Kıtası";
    if (lat >= -35 && lat <= 38 && lng >= -18 && lng <= 52) return "Afrika Kıtası";
    if (lat >= 15 && lat <= 70 && lng >= -168 && lng <= -52) return "Kuzey Amerika";
    if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return "Güney Amerika";
    if (lng >= -180 && lng <= -100) return "Pasifik Okyanusu";
    if (lng >= -60 && lng <= 0) return "Atlantik Okyanusu";
    if (lng >= 50 && lng <= 100 && lat <= 20) return "Hint Okyanusu";
    return "Açık Deniz / Küresel Yörünge";
}

function checkIsDaylight(lat, lng, date) {
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
    const solarNoonLng = -(utcHours - 12) * 15;
    let diffLng = Math.abs(lng - solarNoonLng);
    if (diffLng > 180) diffLng = 360 - diffLng;
    return diffLng < 90;
}

// Ortalı Canlı UTC Saat Göstergesi
function initClock() {
    const clockEl = document.getElementById("utcClock");
    function tick() {
        const now = new Date();
        if (clockEl) {
            clockEl.textContent = now.toUTCString().slice(17, 25);
        }
    }
    tick();
    setInterval(tick, 1000);
}
