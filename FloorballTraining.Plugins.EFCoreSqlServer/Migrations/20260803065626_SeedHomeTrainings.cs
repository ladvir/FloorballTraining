using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FloorballTraining.Plugins.EFCoreSqlServer.Migrations
{
    /// <inheritdoc />
    public partial class SeedHomeTrainings : Migration
    {
        // Domácí (= individuální) tréninky, které hráč zvládne sám doma.
        // Ukládají se jako Training s IsIndividual = 1, IsDraft = 0, aby se objevily
        // v katalogu /trainings/individual (TrainingPicker) a šly logovat jako událost.
        // Značka CreatedByUserId = 'seed:home-training' je jediný zdroj pravdy pro
        // idempotentní guard i pro Down() – nevytváří žádný nový sloupec.
        private const string SeedMarker = "seed:home-training";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($@"
IF NOT EXISTS (SELECT 1 FROM [Trainings] WHERE [CreatedByUserId] = N'{SeedMarker}')
BEGIN
    INSERT INTO [Trainings]
        ([Name],[Description],[Duration],[PersonsMin],[PersonsMax],[GoaliesMin],[GoaliesMax],[Intensity],[Difficulty],[Environment],[IsDraft],[IsIndividual],[CreatedAt],[CreatedByUserId])
    VALUES
    (N'Kličkování ze strany na stranu', N'Vybavení: florbalka a míček, hladká podlaha. Provedení: postav se do mírného stoje rozkročného, míček veď čepelí plynule zleva doprava před tělem, zápěstí uvolněné, hlavu nahoru. Dávkování: 3x45 sekund, mezi sériemi 30 s pauza. Tip: nedívej se na míček, veď ho citem.', 10, 1, 1, 0, 0, 2, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Forhend–bekhend na místě', N'Vybavení: florbalka a míček. Provedení: míček přendávej krátkými doteky z forhendové na bekhendovou stranu čepele na místě před tělem. Dávkování: 3x40 sekund. Tip: postupně zrychluj a zkracuj dráhu míčku.', 10, 1, 1, 0, 0, 2, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Osmičky kolem nohou', N'Vybavení: florbalka a míček. Provedení: veď míček ve tvaru osmičky mezi nohama a kolem nich. Dávkování: 3x60 sekund, střídej směr. Tip: drž nízký postoj a stabilní rovnováhu.', 10, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Kličkování v podřepu', N'Vybavení: florbalka a míček. Provedení: sniž se do podřepu a kličkuj ze strany na stranu, stehna pracují. Dávkování: 4x30 sekund. Tip: záda rovná, pohyb vychází ze zápěstí, ne z paží.', 8, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Slalom kolem lahví', N'Vybavení: 4–6 PET lahví nebo bot jako překážky, florbalka, míček. Provedení: rozestav překážky do řady a proveď míček slalomem tam a zpět. Dávkování: 8 průchodů, měř si čas. Tip: míček veď těsně u překážek.', 12, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Toe drags – přitahování míčku', N'Vybavení: florbalka a míček. Provedení: patkou čepele přitahuj míček k tělu a zase ho posílej dopředu. Dávkování: 3x40 sekund. Tip: procvičuje ochranu míčku před soupeřem.', 10, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Kličkování se zavřenýma očima', N'Vybavení: florbalka a míček. Provedení: kličkuj ze strany na stranu se zavřenýma očima, spoléhej jen na cit v rukou. Dávkování: 3x30 sekund. Tip: zlepšuje kontrolu míčku bez pohledu dolů.', 8, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Rychlé ťukání míčku mezi čepelí', N'Vybavení: florbalka a míček. Provedení: rychlými krátkými doteky ťukej míček z jedné strany čepele na druhou co nejrychleji. Dávkování: 5x20 sekund naplno. Tip: zaměř se na frekvenci, ne na velký rozsah.', 8, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Kličkování v chůzi po bytě', N'Vybavení: florbalka a míček. Provedení: procházej se po bytě a plynule veď míček, obcházej nábytek. Dávkování: 10 minut souvisle. Tip: hlavu nahoru, sleduj okolí místo míčku.', 10, 1, 1, 0, 0, 1, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Roll the ball pod čepelí', N'Vybavení: florbalka a míček. Provedení: kutálej míček dopředu a dozadu pod čepelí drženou kolmo, kontroluj ho jemným tlakem. Dávkování: 3x45 sekund. Tip: rozvíjí měkký cit pro míček.', 8, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Kličkování jednou rukou', N'Vybavení: florbalka a míček. Provedení: drž hůl jen horní rukou a veď míček ze strany na stranu. Dávkování: 3x30 sekund na každou variantu. Tip: posiluje předloktí a zápěstí, zlepšuje dosah.', 10, 1, 1, 0, 0, 2, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Dva míčky – střídavé kličkování', N'Vybavení: florbalka a dva míčky. Provedení: veď oba míčky vedle sebe a střídavě je posouvej do stran. Dávkování: 3x40 sekund. Tip: náročné na koordinaci, začni pomalu.', 10, 1, 1, 0, 0, 2, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Přihrávky forhendem o zeď', N'Vybavení: florbalka, míček, hladká pevná zeď. Provedení: přihrávej míček forhendem o zeď a zpracuj odražený míček. Dávkování: 3x50 přihrávek. Tip: přihrávej po zemi a míček tlač, netahej.', 12, 1, 1, 0, 0, 2, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Přihrávky bekhendem o zeď', N'Vybavení: florbalka, míček, zeď. Provedení: přihrávej a zpracovávej míček pouze bekhendovou stranou čepele. Dávkování: 3x40 přihrávek. Tip: bekhend bývá slabší strana, věnuj mu čas navíc.', 12, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'One-touch přihrávky o zeď', N'Vybavení: florbalka, míček, zeď. Provedení: vracej odražený míček zpět na první dotek bez zastavení. Dávkování: 4x30 sekund. Tip: měkká čepel tlumí míček, pak hned přihraj.', 12, 1, 1, 0, 0, 3, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Přihrávka a zpracování na cíl na zdi', N'Vybavení: florbalka, míček, zeď, páska na vyznačení cíle. Provedení: vyznač si na zdi cíl a miř do něj, odražený míček pokaždé zpracuj. Dávkování: 3x2 minuty. Tip: počítej si trefené cíle.', 12, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Přihrávky o zeď v pohybu do stran', N'Vybavení: florbalka, míček, zeď. Provedení: přihrávej o zeď a mezi přihrávkami se přesouvej stranovým během. Dávkování: 4x45 sekund. Tip: zapojíš nohy i přihrávku zároveň.', 12, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Střídání forhend/bekhend o zeď', N'Vybavení: florbalka, míček, zeď. Provedení: střídej pravidelně forhendovou a bekhendovou přihrávku o zeď. Dávkování: 3x1 minuta. Tip: udržuj plynulý rytmus.', 10, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Zápěstní střela na cíl', N'Vybavení: florbalka, míčky, síť nebo rebounder, cíl. Provedení: prováděj zápěstní střely s důrazem na přesnost a rychlé zápěstí. Dávkování: 4x10 střel. Tip: přenášej váhu ze zadní nohy na přední.', 15, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Tažená střela', N'Vybavení: florbalka, míčky, síť. Provedení: táhni míček po zemi a v zakončení švihni čepelí, míček je celou dobu na čepeli. Dávkování: 4x10 střel. Tip: dlouhý tah dává větší sílu.', 15, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Bekhendová střela', N'Vybavení: florbalka, míčky, síť. Provedení: střílej bekhendem, zaměř se na zvednutí míčku. Dávkování: 3x10 střel. Tip: dostaň čepel pod míček a švihni zápěstím nahoru.', 12, 1, 1, 0, 0, 2, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Rychlé střely – 10 míčků na čas', N'Vybavení: 10 míčků, florbalka, síť. Provedení: připrav 10 míčků do řady a co nejrychleji je vystřel, měř si čas. Dávkování: 4 kola s pauzou. Tip: spoj rychlost s alespoň 70 procenty přesnosti.', 12, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Přesnost – střelba do rohů', N'Vybavení: florbalka, míčky, branka nebo cíle v rozích. Provedení: miř postupně do čtyř rohů branky. Dávkování: 5 sérií po 8 střelách. Tip: nejdřív přesnost, pak přidej sílu.', 15, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Střela po zpracování přihrávky', N'Vybavení: florbalka, míček, zeď, síť. Provedení: přihraj o zeď, zpracuj odražený míček a hned vystřel na cíl. Dávkování: 4x10 opakování. Tip: minimalizuj počet doteků před střelou.', 15, 1, 1, 0, 0, 3, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Střela z otočky', N'Vybavení: florbalka, míčky, síť. Provedení: stůj zády k brance, otoč se s míčkem a vystřel. Dávkování: 3x8 na každou stranu. Tip: hlídej si rovnováhu při otočce.', 12, 1, 1, 0, 0, 3, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Střela po kličkování slalomem', N'Vybavení: 3 překážky, míčky, florbalka, síť. Provedení: proveď míček slalomem a zakonči střelou na cíl. Dávkování: 10 opakování. Tip: neztrácej rychlost před zakončením.', 15, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Rychlé nohy na místě', N'Vybavení: žádné. Provedení: běž na místě s co nejvyšší frekvencí kroků na špičkách. Dávkování: 6x15 sekund naplno, 30 s pauza. Tip: drž mírný předklon a aktivní paže.', 8, 1, 1, 0, 0, 3, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Přeskoky přes hůl ze strany na stranu', N'Vybavení: florbalka na zemi. Provedení: polož hůl na zem a snožmo ji přeskakuj ze strany na stranu. Dávkování: 5x20 sekund. Tip: měkké dopady, koleno mírně pokrčené.', 8, 1, 1, 0, 0, 3, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Přeskoky vpřed–vzad přes čáru', N'Vybavení: čára nebo hůl na zemi. Provedení: snožmo přeskakuj přes čáru dopředu a dozadu co nejrychleji. Dávkování: 5x20 sekund. Tip: krátký kontakt se zemí.', 8, 1, 1, 0, 0, 3, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Agility žebřík z pásky', N'Vybavení: lepicí páska na vyznačení žebříku. Provedení: vyznač si na podlaze žebřík a procvič různé vzory kroků (dovnitř-ven, boční). Dávkování: 8 průchodů. Tip: rychlost nohou před velikostí kroků.', 12, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Skoky snožmo do stran', N'Vybavení: žádné. Provedení: odrážej se snožmo do stran přes pomyslnou čáru. Dávkování: 5x20 sekund. Tip: přistávej měkce a hned se odraz zpět.', 8, 1, 1, 0, 0, 3, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Vysoká kolena na místě', N'Vybavení: žádné. Provedení: běž na místě a zvedej kolena do výše pasu. Dávkování: 5x20 sekund. Tip: aktivně pracuj pažemi.', 6, 1, 1, 0, 0, 3, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Intervalový sprint na místě', N'Vybavení: žádné. Provedení: střídej 20 sekund maximálního běhu na místě a 20 sekund klusu. Dávkování: 8 intervalů. Tip: dýchej pravidelně, drž techniku i v únavě.', 12, 1, 1, 0, 0, 4, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Burpees', N'Vybavení: žádné. Provedení: ze stoje do dřepu, výskok do prkna, klik, zpět a výskok. Dávkování: 5x8 opakování. Tip: kvalita provedení před počtem.', 8, 1, 1, 0, 0, 4, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Výpady', N'Vybavení: žádné. Provedení: střídavě vykračuj do výpadu, zadní koleno klesá k zemi. Dávkování: 3x12 na každou nohu. Tip: koleno přední nohy nepřesahuje špičku.', 8, 1, 1, 0, 0, 2, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Dřepy', N'Vybavení: žádné. Provedení: dřep s rovnými zády do pravého úhlu v kolenou. Dávkování: 4x15. Tip: váha na patách, kolena směřují ven.', 8, 1, 1, 0, 0, 2, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Plank – prkno', N'Vybavení: žádné. Provedení: opři se o předloktí a špičky, tělo v jedné přímce, zpevni břicho. Dávkování: 4x40 sekund. Tip: nezvedej ani neprohýbej pánev.', 6, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Švihadlo', N'Vybavení: švihadlo. Provedení: skákej přes švihadlo plynulým tempem. Dávkování: 6x1 minuta. Tip: skákej nízko a odrážej se ze špiček.', 12, 1, 1, 0, 0, 3, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Mountain climbers', N'Vybavení: žádné. Provedení: v pozici prkna střídavě přitahuj kolena k hrudi. Dávkování: 5x30 sekund. Tip: drž pánev nízko a stabilní.', 6, 1, 1, 0, 0, 4, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Jumping jacks', N'Vybavení: žádné. Provedení: rozskoky s upažením a snožením. Dávkování: 5x40 sekund. Tip: dobré jako součást rozehřátí.', 6, 1, 1, 0, 0, 3, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Wall sit – sed u zdi', N'Vybavení: zeď. Provedení: opři se zády o zeď a sedni si do pravého úhlu, jako bys seděl na židli. Dávkování: 4x40 sekund. Tip: kolena přesně nad kotníky.', 6, 1, 1, 0, 0, 2, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Kliky', N'Vybavení: žádné. Provedení: kliky s tělem v jedné přímce, lokty mírně u těla. Dávkování: 4x maximum opakování. Tip: pokud je to těžké, dej kolena na zem.', 8, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Posilování zápěstí s holí (roll-up)', N'Vybavení: florbalka, malé závaží nebo lahev na provázku. Provedení: přivázané závaží navíjej otáčením zápěstí na hůl a zase pomalu spouštěj. Dávkování: 3x5 navinutí. Tip: pohyb dělej jen zápěstím.', 8, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Balancování míčku na čepeli', N'Vybavení: florbalka, míček. Provedení: udrž míček v rovnováze na čepeli co nejdéle, jemně koriguj zápěstím. Dávkování: 5 pokusů, měř si čas. Tip: rozvíjí měkký cit pro míček.', 8, 1, 1, 0, 0, 1, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Zvedání míčku holí (scooping)', N'Vybavení: florbalka, míček. Provedení: naber míček čepelí ze země a vyhoď ho lehce do vzduchu, pak zpracuj. Dávkování: 3x10 opakování. Tip: pomáhá při vypichování a hře u mantinelu.', 8, 1, 1, 0, 0, 2, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Žonglování s míčkem na čepeli', N'Vybavení: florbalka, míček. Provedení: nadhazuj a chytej míček na čepeli opakovaně za sebou. Dávkování: 5 pokusů o co nejvíce opakování. Tip: drobné pohyby zápěstí, oči na míčku.', 10, 1, 1, 0, 0, 1, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Bicycle crunch – šikmé břicho', N'Vybavení: žádné. Provedení: v lehu střídavě přitahuj loket k opačnému koleni. Dávkování: 3x20 opakování. Tip: pohyb pomalý a kontrolovaný.', 8, 1, 1, 0, 0, 3, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Reakční kličkování na povel', N'Vybavení: florbalka, míček, pomocník. Provedení: kličkuj a na povel pomocníka okamžitě změň směr nebo styl vedení. Dávkování: 4x45 sekund. Tip: bez pomocníka reaguj na náhodné zvuky.', 10, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Míček o zeď a chyť čepelí', N'Vybavení: florbalka, míček, zeď. Provedení: hoď míček o zeď a chyť odražený míček na čepel, tlum ho. Dávkování: 3x2 minuty. Tip: trénuje reflexy a měkké zpracování.', 8, 1, 1, 0, 0, 2, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Kličkování s žonglováním druhou rukou', N'Vybavení: florbalka, míček, tenisák. Provedení: veď florbalový míček a zároveň si druhou rukou pohazuj tenisák. Dávkování: 3x40 sekund. Tip: rozděluje pozornost, náročné na koordinaci.', 10, 1, 1, 0, 0, 2, 3, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Reakční start na barvu', N'Vybavení: pomocník nebo barevné kartičky. Provedení: každé barvě přiřaď směr a na její ukázání vystartuj tím směrem s míčkem. Dávkování: 10 startů. Tip: soustřeď se na první krok.', 8, 1, 1, 0, 0, 3, 2, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Dynamická rozcvička doma', N'Vybavení: žádné. Provedení: kroužení pažemi, výpady s rotací, švihy nohou, kroužení kotníky a zápěstími. Dávkování: 8 minut souvisle. Tip: dělej vždy před tréninkem i střelbou.', 10, 1, 1, 0, 0, 2, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Protažení po tréninku', N'Vybavení: podložka. Provedení: postupně protáhni stehna, lýtka, záda, ramena a předloktí, výdrž v každé pozici. Dávkování: 30–40 sekund na každý sval. Tip: neprotahuj do bolesti, dýchej.', 10, 1, 1, 0, 0, 1, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Mobilita kyčlí a kotníků', N'Vybavení: žádné. Provedení: kroužení kyčlemi, hluboký dřep s výdrží, kroužení a naklánění kotníků. Dávkování: 8 minut. Tip: zlepšuje nízký florbalový postoj.', 8, 1, 1, 0, 0, 1, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}'),
    (N'Uvolnění zápěstí a předloktí', N'Vybavení: žádné. Provedení: kroužení zápěstími, protažení předloktí tlakem dlaně, střídej ohyb a natažení. Dávkování: 5 minut. Tip: dobré po střelbě a kličkování.', 6, 1, 1, 0, 0, 1, 1, 0, 0, 1, SYSUTCDATETIME(), N'{SeedMarker}');
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($"DELETE FROM [Trainings] WHERE [CreatedByUserId] = N'{SeedMarker}';");
        }
    }
}
