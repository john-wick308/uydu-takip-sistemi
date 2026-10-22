/**
 * SATELLITES.JS - Örnek ve Popüler Uydu Yörünge Veritabanı
 * 
 * TLE (Two-Line Element): Uydunun uzaydaki yörünge koordinatlarını,
 * eğimini ve hızını tanımlayan standart 2 satırlı veri formatıdır.
 * Bu veriler NASA ve CelesTrak tarafından düzenli olarak güncellenir.
 */

const POPULAR_SATELLITES = [
    // --- 1. STARLINK UYDULARI ---
    {
        name: "STARLINK-38090",
        noradId: "69994",
        category: "starlink",
        categoryName: "Starlink İnternet (Uçan Alçak Yörünge)",
        operator: "SpaceX",
        description: "SpaceX tarafından küresel yüksek hızlı internet sağlamak amacıyla alçak Dünya yörüngesine (LEO) fırlatılan Starlink uydusu.",
        tleLine1: "1 69994U 26159V   26289.27722202  .00007398  00000+0  23124-3 0  9992",
        tleLine2: "2 69994  97.2842 130.8231 0001894  80.5179 279.6278 15.33446357 16404"
    },
    {
        name: "STARLINK-37923",
        noradId: "69949",
        category: "starlink",
        categoryName: "Starlink İnternet (Uçan Alçak Yörünge)",
        operator: "SpaceX",
        description: "SpaceX V2 Mini serisi Starlink uydusu, lazer optik haberleşme ile internet aktarımı sağlar.",
        tleLine1: "1 69949U 26157G   26290.17290634  .00041959  00000+0  12455-2 0  9995",
        tleLine2: "2 69949  53.1580 209.3433 0001189  99.4007 260.7130 15.34413299 15469"
    },
    {
        name: "STARLINK-38077",
        noradId: "69983",
        category: "starlink",
        categoryName: "Starlink İnternet (Uçan Alçak Yörünge)",
        operator: "SpaceX",
        description: "SpaceX takım uydu ağının parçası. Yaklaşık 550 km yükseklikte saatte 27.000 km hızla hareket eder.",
        tleLine1: "1 69983U 26159J   26289.53008818  .00024418  00000+0  75554-3 0  9995",
        tleLine2: "2 69983  97.2836 131.0931 0001726 106.1668 253.9765 15.33474363 16445"
    },
    {
        name: "STARLINK-37891",
        noradId: "69948",
        category: "starlink",
        categoryName: "Starlink İnternet (Uçan Alçak Yörünge)",
        operator: "SpaceX",
        description: "Güneş panelleriyle çalışan otonom manevra kabiliyetine sahip Starlink takımyıldızı uydusu.",
        tleLine1: "1 69948U 26157F   26290.18964462  .00038857  00000+0  11538-2 0  9996",
        tleLine2: "2 69948  53.1572 208.7229 0000792  67.7471 292.3616 15.34438780 15470"
    },
    {
        name: "STARLINK-1007",
        noradId: "44714",
        category: "starlink",
        categoryName: "Starlink İnternet (Uçan Alçak Yörünge)",
        operator: "SpaceX",
        description: "İlk nesil operasyonel Starlink uydularından biridir.",
        tleLine1: "1 44714U 19074B   26289.87321455  .00002511  00000+0  18241-3 0  9994",
        tleLine2: "2 44714  53.0538  87.2140 0001351  95.4512 264.6710 15.06412581267812"
    },

    // --- 2. TÜRK UYDULARI (TÜRKSAT & GÖKTÜRK & İMECE) ---
    {
        name: "TURKSAT 6A",
        noradId: "60233",
        category: "turk",
        categoryName: "Milli Haberleşme (Sabit TV Uydusu - 35.786 km)",
        operator: "Türkiye (TÜBİTAK UZAY / TUSAŞ / Türksat)",
        description: "Türkiye'nin ilk yerli ve milli haberleşme uydusudur. 42° Doğu boylamında jeosenkron (sabit) yörüngede hizmet vermektedir.",
        tleLine1: "1 60233U 24127A   26290.01428971  .00000148  00000+0  00000+0 0  9992",
        tleLine2: "2 60233   0.0282 207.8583 0004829   1.0210 223.8397  1.00274913  8232"
    },
    {
        name: "TURKSAT 5B",
        noradId: "50212",
        category: "turk",
        categoryName: "Genişbant Haberleşme (Sabit TV Uydusu - 35.786 km)",
        operator: "Türksat A.Ş.",
        description: "Türkiye'nin Ka-Bant kapasitesini 15 kattan fazla artıran yüksek verimli veri ve televizyon haberleşme uydusu.",
        tleLine1: "1 50212U 21126A   26290.25947498  .00000148  00000+0  00000+0 0  9990",
        tleLine2: "2 50212   0.0776 334.6417 0002603 318.2755 228.2957  1.00273050 17520"
    },
    {
        name: "TURKSAT 5A",
        noradId: "47306",
        category: "turk",
        categoryName: "Haberleşme (Sabit TV Uydusu - 35.786 km)",
        operator: "Türksat A.Ş.",
        description: "31° Doğu yörüngesinde Türkiye, Avrupa, Akdeniz ve Afrika'ya yayın ve haberleşme sağlayan uydu.",
        tleLine1: "1 47306U 21001A   26290.27336503  .00000156  00000+0  00000+0 0  9992",
        tleLine2: "2 47306   0.0122 145.5601 0000290 282.3675  87.2192  1.00272754 21193"
    },
    {
        name: "TURKSAT 4A",
        noradId: "39522",
        category: "turk",
        categoryName: "Haberleşme (Sabit TV Uydusu - 35.786 km)",
        operator: "Türksat A.Ş.",
        description: "42° Doğu boylamında milyonlarca haneye televizyon yayını ve internet ileten haberleşme uydusu.",
        tleLine1: "1 39522U 14007A   26290.08561672  .00000148  00000+0  00000+0 0  9998",
        tleLine2: "2 39522   0.0476 293.8031 0004550 325.1508 199.4699  1.00274221 46190"
    },
    {
        name: "GOKTURK 1A (Göktürk-A)",
        noradId: "41875",
        category: "turk",
        categoryName: "Keşif/Gözlem (Uçan Alçak Yörünge - 680 km)",
        operator: "Türk Silahlı Kuvvetleri / Bakanlık",
        description: "Türkiye'nin askeri ve sivil amaçlı yüksek çözünürlüklü yer gözlem ve istihbarat uydusu (Göktürk A). Kutupsal alçak yörüngede döner.",
        tleLine1: "1 41875U 16073A   26290.27865378  .00000290  00000+0  66148-4 0  9996",
        tleLine2: "2 41875  98.1497 183.2598 0001293  71.9648 288.1695 14.62767414526678"
    },
    {
        name: "GOKTURK 2",
        noradId: "39030",
        category: "turk",
        categoryName: "Milli Yer Gözlem (Uçan Alçak Yörünge - 680 km)",
        operator: "TÜBİTAK UZAY / TUSAŞ",
        description: "Türkiye'de tasarlanıp üretilen ilk yüksek çözünürlüklü yer gözlem uydusu. Yaklaşık 680 km irtifada görev yapar.",
        tleLine1: "1 39030U 12073A   26290.27582286 -.00000124  00000+0 -11297-4 0  9999",
        tleLine2: "2 39030  97.6757 121.5798 0001117  56.1276 304.0040 14.75634134742516"
    },

    // --- 3. UZAY İSTASYONLARI ---
    {
        name: "ISS (Uluslararası Uzay İstasyonu)",
        noradId: "25544",
        category: "station",
        categoryName: "İnsanlı Uzay İstasyonu",
        operator: "NASA / ESA / JAXA / Roscosmos",
        description: "İçerisinde astronotların yaşadığı, Dünya çevresinde günde 16 tur atan devasa insanlı araştırma laboratuvarı.",
        tleLine1: "1 25544U 98067A   26290.14324128  .00012845  00000+0  23314-3 0  9991",
        tleLine2: "2 25544  51.6415 152.1287 0005124  88.3142 271.8541 15.49842145481235"
    },
    {
        name: "TIANGONG (Çin Uzay İstasyonu)",
        noradId: "48274",
        category: "station",
        categoryName: "İnsanlı Uzay İstasyonu",
        operator: "CNSA (Çin)",
        description: "Çin'in alçak Dünya yörüngesindeki kalıcı mürettebatlı modüler uzay istasyonu.",
        tleLine1: "1 48274U 21035A   26290.18734211  .00018542  00000+0  19842-3 0  9998",
        tleLine2: "2 48274  41.4721 114.2384 0003891 210.5124 149.5218 15.58912411291845"
    },

    // --- 4. UZAY TELESKOPLARI VE BİLİM ---
    {
        name: "HUBBLE UZAY TELESKOBU (HST)",
        noradId: "20580",
        category: "science",
        categoryName: "Uzay Teleskobu",
        operator: "NASA / ESA",
        description: "1990'dan beri evrenin derinliklerini fotoğraflayan ve astronomide devrim yaratan efsanevi optik uzay teleskobu.",
        tleLine1: "1 20580U 90037B   26289.84152841  .00001247  00000+0  58412-4 0  9994",
        tleLine2: "2 20580  28.4691 245.8142 0002841 312.4512  47.5124 15.09142851881452"
    },
    {
        name: "AQUA (NASA Yer Gözlem)",
        noradId: "27424",
        category: "science",
        categoryName: "İklim ve Yer Bilim Uydusu",
        operator: "NASA",
        description: "Dünya'nın su döngüsünü, okyanus buharlaşmasını ve bulut hareketlerini inceleyen bilimsel uydu.",
        tleLine1: "1 27424U 02022A   26290.11245892  .00000184  00000+0  85124-4 0  9997",
        tleLine2: "2 27424  98.2145  84.5124 0001421  74.5128 285.6124 14.57114251189452"
    },

    // --- 5. NAVİGASYON VE GPS ---
    {
        name: "GPS BIIF-2 (USA 232)",
        noradId: "37753",
        category: "nav",
        categoryName: "Navigasyon / GPS Uydusu",
        operator: "US Space Force",
        description: "Telefonlarımızın ve araçlarımızın konum bulmasını sağlayan 20.200 km irtifadaki Amerikan GPS uydusu.",
        tleLine1: "1 37753U 11036A   26289.41258412 -.00000045  00000+0  00000+0 0  9991",
        tleLine2: "2 37753  55.1245 320.4512 0041258 241.5124 118.2541  2.00561425110452"
    },

    // --- 6. HAVA DURUMU ---
    {
        name: "NOAA 19 (Meteoroloji)",
        noradId: "33591",
        category: "weather",
        categoryName: "Meteoroloji Uydusu",
        operator: "NOAA / NASA",
        description: "Dünya geneli kasırga, bulut ve fırtına hareketlerini takip eden alçak kutupsal hava durumu uydusu.",
        tleLine1: "1 33591U 09005A   26290.14258124  .00000145  00000+0  64125-4 0  9995",
        tleLine2: "2 33591  98.7125 142.1542 0013845  85.4125 274.8512 14.12451842851245"
    }
];
