/*
================================================================================
  Import cvičení z floorball_exercises.json do Activities / Tags / ActivityTags
================================================================================
  Mapování:
    nazev                                  -> Activities.Name
    popisek + Nastavení/Provedení/Varianty/ -> Activities.Description (spojeno)
    Poznámky
    cil                                     -> Tags.Name (vytvoří tag, pokud neexistuje) + vazba přes ActivityTags
    id (z JSON)                             -> ignorováno (nová Id přidělí identity)

  Aktivity se vkládají jako koncept (IsDraft = 1) s výchozími hodnotami pro
  PersonsMin/Max, DurationMin/Max, Difficulty, Intensity, Environment atd.,
  protože zdrojová data tyto údaje neobsahují - proto před publikováním
  doporučujeme aktivity zkontrolovat a doplnit v administraci.
================================================================================
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('tempdb..#Import') IS NOT NULL DROP TABLE #Import;
CREATE TABLE #Import (
    SourceId INT NOT NULL,
    Nazev NVARCHAR(400) NOT NULL,
    Popis NVARCHAR(MAX) NOT NULL,
    Cil NVARCHAR(400) NOT NULL
);

DECLARE @ImportBatch DATETIME2 = SYSUTCDATETIME();

INSERT INTO #Import (SourceId, Nazev, Popis, Cil) VALUES
(1, N'Basic Passes', N'Základní přihrávky ve dvojicích přes celou šíři hřiště.

Nastavení: Hráči se rozdělí do dvojic, jeden míček na každou dvojici. Jeden hráč na každé straně haly.

Provedení: Hráči si vzájemně přihrávají míček. Začátečníci míček zastaví, pokročilejší se snaží přihrávat bez zastavení.

Varianty: Přihrávky mohou být vysoké nebo nízké; vzdálenost hráčů lze měnit. Pro větší zátěž hráč po přihrávce otočí, dotkne se mantinelu a otočí se zpět. Alternativně se hráči začínají daleko od sebe a s každou přihrávkou se přibližují, pak opět vzdalují.

Poznámky: Začátečníci míček zastavují, pokročilí se snaží přihrávat přímo. Vzdálenost lze měnit od šíře hřiště až po cca 2 metry.', N'Přihrávání míčku ve dvojicích.'),
(2, N'Fox and Hares', N'Hra na liška a zajíce – přesné přihrávky a orientace na hřišti pod tlakem.

Nastavení: Jeden hráč (liška) se snaží chytit ostatní (zajíce). Mezi zajíci jsou tři míčky.

Provedení: Liška se snaží dotknout zajíců. Při dotyku si role vymění. Hráč (zajíc) může být chycen pouze tehdy, nemá-li míček. Zajíci si přihrávají, aby se navzájem chránili – zajíc s míčkem je chráněn.

Varianty: Lze hrát s více nebo méně míčky – čím méně míčků, tím těžší je pro zajíce zůstat v bezpečí. Lze hrát i s více než jednou liškou.

Poznámky: Toto cvičení může být dobré pro budování týmu. Zajíc, který je chycen, buď vypadá, nebo si vymění roli s liškou.', N'Přesné přihrávání; orientace na hřišti.'),
(3, N'The Box', N'Střelba na krabici – týmy se snaží posunout krabici na stranu soupeřů.

Nastavení: Dva týmy na protilehlých koncích; zóna uprostřed s prázdnou kartonovou krabicí; hodně míčků u obou týmů.

Provedení: Hráči střílí na krabici a snaží se ji posunout do zóny soupeřů. Pokud krabice přejde přes čáru, tým vyhrává.

Varianty: Krabici lze nahradit velkým lehkým míčem.

Poznámky: Pokud dojdou míčky, je možné dovolit sbírání ze středové zóny. Z bezpečnostních důvodů je vhodné hru krátce přerušit.', N'Přesné přihrávání a střelba.'),
(4, N'Zones', N'Hráči přihrávají míčky zónou soupeřů – přesné přihrávání pod obranou.

Nastavení: Hřiště je rozděleno na čtvrtiny; v každé čtvrtině jsou pouze hráči stejného týmu (A, B); jeden míček v každé čtvrtině, celkem 4 míčky.

Provedení: Hráči se snaží přihrát míčky zónou soupeřů; každá úspěšná přihrávka znamená bod.

Varianty: Měnit počet míčků; povolit vysoké přihrávky, ale nepočítat je jako body; nebo body za vysoké přihrávky neuznat.

Poznámky: Přihrávky jsou povoleny pouze po zemi. Obrana je samozřejmě povolena. Po čase střídejte pozice, protože hráči ve dvou středových čtvrtinách jsou ve více náročných pozicích.', N'Přesné přihrávání.'),
(5, N'Golden Pass', N'Hra bez branek – tým se snaží co nejvíce přihrát za daný čas.

Nastavení: Dva týmy, bez branek, hraje se na celém hřišti.

Provedení: Každý tým se snaží přihrát co nejvíce přihrávek. Soupeřící tým se snaží zabránit přihrávkám. Každá úspěšná přihrávka = bod. Týmy soutěží buď o nejdelší sérii, nebo o počet úspěšných přihrávek za daný čas.

Varianty: Zakázat přihrávky zpět hráči, od něhož přihrávka přišla; zakázat přihrávky předchozím dvěma hráčům. Pro pokročilejší hráče povolovat pouze přímé přihrávky. Pro středně pokročilé omezit počet doteků před přihrávkou. Omezit prostor pro obtížnější variantu.

Poznámky: Nedovolovat dribling. Hráči musí běhat a otevírat prostor. Trenér může po každé úspěšné přihrávce hlasitě počítat.', N'Přihrávkové dovednosti.'),
(6, N'Pass in Circle', N'Přihrávky v kruhu – hráči si přihrávají napříč kruhem.

Nastavení: 5 nebo více hráčů v kruhu o průměru cca 5→10 metrů, jeden míček na kruh.

Provedení: Hráč s míčkem přihraje na libovolného jiného hráče v kruhu. Hráči se snaží přihrávat přímo.

Varianty: Velikost kruhu lze měnit (od cca 2 metrů až po celou šíři haly). Cvičení lze hrát i se 2 nebo 3 míčky.

Poznámky: Začátečníci mohou šout jméno hráče, kterému přihrávají. Pokud cvičení vypadá příliš pomalu, lze přidat další míček.', N'Přesné přihrávání.'),
(7, N'Random Pair Passing', N'Přihrávky ve dvojicích při volném pohybu po hřišti.

Nastavení: Hráči se rozdělí do dvojic, jeden míček na dvojici.

Provedení: Oba hráči se pohybují náhodně po hale a přihrávají si míček.

Varianty: Přidávat překážky (branky, lavičky, velké míče); zmenšit hrací plochu.

Poznámky: Hráči musí dávat pozor jak na sebe navzájem, tak na ostatní hráče a stěny haly. Dvojice lze čas od času měnit.', N'Přesné přihrávání z různých pozic.'),
(8, N'3→1 Passing', N'Tři hráči přihrávají čtvrtému, který přihrává zpět – rychlé a přesné přihrávky.

Nastavení: čtyři hráči ve skupině, tři míčky na skupinu. Tři hráči jsou asi 3 metry od čtvrtého. Tři hráči mají míčky.

Provedení: Tři hráči přihrávají čtvrtému po jednom. čtvrtý hráč přihrává přímou přihrávkou zpět a rychle. Po čase hráči střídají pozice.

Varianty: Tři hráči se mohou více rozptýlit. Vzdálenost lze měnit. U delších přihrávek lze přihrávat dříve, než se vrátí předchozí přihrávka. Lze provádět i s vysokými nebo bekhendem.

Poznámky: Skupiny tří jsou možné, pokud počet hráčů neodpovídá.', N'Rychlé a přesné přihrávání.'),
(9, N'High/Low Pass', N'Přihrávky dle barvy kužele – střídání vysokých a nízkých přihrávek.

Nastavení: Hráči rozděleni do dvou řad, míčky s řadou. 6 kuželů, náhodně smíchané červené a žluté, podél postranních čar hřiště.

Provedení: První dva hráči každé řady tvoří dvojici, startují z protilehlých konců. Oba běží dopředu po svých stranách. Hráč s míčkem přihraje partnerovi při míjení kužele. červený kužel = nízká přihrávka, žlutý kužel = vysoká přihrávka.

Varianty: Šíři cvičení lze měnit. Místo návratu do řad lze vytvořit nové řady na konci hřiště.

Poznámky: Hráči nemusí běžet příliš rychle, důraz je na přihrávky. Další dvojice nemusí čekat na dokončení předchozí.', N'Vysoké a nízké přihrávky.'),
(10, N'Central Station', N'Hráči v kruhu přihrávají do středu, kde dva hráči vracejí míček a přebíhají do kruhu.

Nastavení: Hráči v kruhu, dva hráči ve středu, dva míčky.

Provedení: Hráči v kruhu přihrávají do středu. Hráči uprostřed přihrávají zpět do kruhu a pak přebíhají k libovolnému hráči v kruhu, který je vystřídá ve středu. Hráč v kruhu, který dostane míček, ho vrátí zpět do středu.

Varianty: S jedním hráčem uprostřed (jeden míček) je snazší, ale brzy nudí. Se třemi hráči uprostřed (tři míčky) je velmi náročné. Zmenšením poloměru kruhu cvičení zrychlíte.

Poznámky: Jako hráč v kruhu: (1) dostaneš míček – vrátíš ho do středu; (2) přibíhá k tobě někdo ze středu – ty jdeš do středu. Jako hráč uprostřed: (1) jdeš do středu kruhu, (2) dostaneš míček, (3) přihraješ komukoli v kruhu, (4) odběhneš k libovolnému hráči v kruhu.', N'Přihrávání.'),
(11, N'Triangle', N'Tři hráči v trojúhelníku si přihrávají, jeden obránce uprostřed se snaží zachytit míček.

Nastavení: Tři hráči v trojúhelníku, jeden míček. Jeden obránce uprostřed.

Provedení: Hráči si přihrávají, obránce se snaží zachytit míček.

Varianty: Povolovat pouze přímé přihrávky.

Poznámky: Po čase role vyměňte. Tvar trojúhelníku je dynamický. Zmenšením plochy lze ztížit cvičení.', N'Přihrávání s obráncem.'),
(12, N'Double Pass', N'Střední hráč vrací přihrávky ze dvou stran pod tlakem.

Nastavení: Hráči ve skupinách po třech, dva míčky. Hráči tvoří řadu, hráči na krajích mají míčky.

Provedení: Hráč uprostřed vrací přihrávku od hráče 1 a okamžitě se otočí, aby udělal totéž od hráče 2 atd.

Varianty: Měnit vzdálenost přihrávek, nebo povolovat pouze bekhendové přihrávky.

Poznámky: Role vyměňujte. Druhá přihrávka může být odeslána krátce před tím, než se hráč zcela otočí, aby zvýšila tlak.', N'Přihrávání pod tlakem.'),
(13, N'Pass and Cones', N'Přihrávky ve dvojicích mezi kužely – precizní přihrávání.

Nastavení: Hráči rozděleni do dvou řad v rozích. Všechny míčky v jednom rohu.

Provedení: Hráči cvičí ve dvojicích, přihrávají si mezi kužely.

Varianty: Přidat více kuželů pro obtížnější přihrávání.

Poznámky: Po dokončení opakovat z druhého konce nebo se zařadit zpět do řad. Podporovat přímé přihrávky, zejména u pokročilých. Druhá dvojice může začít dříve, než první dvojice dokončí cvičení.', N'Přesné přihrávky.'),
(14, N'Squared', N'Přihrávky v pohybu – hráči přihrávají v čtverci a rotují v opačném směru.

Nastavení: Hráči ve skupinách po 4→5, jeden míček na skupinu.

Provedení: Míček je přihrán dalšímu hráči, přihrávající hráč poté běží opačným směrem na volné místo. Míček se pohybuje dokola, hráči rotují v opačném směru.

Poznámky: Při představování cvičení pomáhají kužely k označení pozic. Po čase zaměňte. Začínejte pomalu, pak zrychlujte.', N'Přihrávky při běhu.'),
(15, N'Passes Don''t Stop', N'Hráči běží podél mantinelu a přihrávají na označených místech.

Nastavení: Hráči roztroušeni podél mantinelu, každý s míčkem u označeného místa. Kužely označují přihrávkové pozice.

Provedení: Hráči běží podél mantinelu. Při dosažení označeného místa dostanou míček a přihrají ho zpět na druhou stranu. Po přihrávce běží na další označené místo.

Varianty: Různě barevné míčky pro různé typy přihrávek (úder, vysoká, bekhend atd.).

Poznámky: Začínejte pomalu a postupně zvyšujte rychlost. Po čase zaměňte směr běhu.', N'Přihrávání.'),
(16, N'Round in Circles', N'Hráči běží v kruhu a přihrávají míček dopředu v přihrávky při pohybu.

Nastavení: Hráči v kruhu po čtyřech nebo pěti. Jeden míček na kruh.

Provedení: Hráči běží v kruhu a přihrávají míček ve stejném směru jako běží (dopředu).

Varianty: Přihrávat míček dozadu hráči za sebou.

Poznámky: Po čase zaměňte stranu. Kužely mohou pomoci udržet kruhový tvar. Hráči musí přihrávat míček mírně před přijímajícím hráčem.', N'Přihrávky při běhu.'),
(17, N'Ad Infinitum', N'Komplexní přihrávkové cvičení přes celé hřiště s rotací hráčů a zakončením střelou.

Nastavení: řada s míčky na pozici 1 v rohu. Dva hráči na pozici 2 (střed) a po dvou v rozích na pozicích 4 a 6. Brankář v bráně na druhé straně.

Provedení: První hráč v řadě na 1 přihraje na pozici 2. Přihrávka se vrátí na pozici 3, odkud hráč přihraje na pozici 4. Míček se vrátí (5) a přihraje do druhého rohu (6). Z rohu se míček vrátí zpět a hráč střelí na bránu. Hráči rotují: 1→4, 4→6, 6→2, 2→1.

Varianty: Totéž cvičení lze hrát zrcadlově z druhé strany.

Poznámky: Další hráč může začít, než předchozí dokončí cvičení, ale musí počkat na hráče na pozici 2.', N'Přesné přihrávání.'),
(18, N'Survivors', N'Dvojice si přihrávají, ničitelé se snaží zachytit přihrávky – kdo vydrží nejdéle?

Nastavení: Hráči ve dvojicích s 1 míčkem na dvojici. Dva nebo tři hráči bez míčku (ničitelé).

Provedení: Dvojice si přihrávají. Ničitelé se snaží zachytit přihrávky. Pokud míček zachytí, oba hráči dvojice si sednou. Kdo vydrží nejdéle, vyhrává.

Varianty: Hrací plocha lze rozdělit na tři oblasti. Prostřední (příkop) je pro ničitele. Dvojice jsou rozděleny, jeden hráč v každé přilehlé zóně, přihrávají přes střed.

Poznámky: Omezit na dva nebo tři dotyky, aby hráči nemohli driblinkem unikat. Podporovat přímé přihrávky.', N'Přihrávání pod tlakem.'),
(19, N'Survivors II', N'Každý hráč má míček, jeden hráč bez míčku ho sbíhá – kdo přežije nejdéle?

Nastavení: Všichni hráči s míčkem, jeden hráč bez míčku (nájemný zabiják).

Provedení: Hráči volně driblinují v omezeném prostoru. Nájemný zabiják se snaží odkopnout míček. Hráč, který přijde o míček, se stává dalším nájemným zabijákem. Kdo vydrží nejdéle?

Varianty: Aby hráči nezůstávali v rozích, lze jim zadat jednoduchý úkol (např. doběhnout z jednoho konce na druhý). Menší hrací plocha = těžší cvičení.

Poznámky: Podporovat fair play.', N'Přihrávky pod tlakem.'),
(20, N'Pass till You Drop', N'Přímé přihrávky přes celou šíři hřiště – která dvojice vydrží nejdéle?

Nastavení: Hráči rozděleni do dvojic, každá dvojice s míčkem. Jeden hráč na každé straně hřiště.

Provedení: Hráči si přihrávají. Povoleny jsou pouze přímé přihrávky. Kdo přijde o míček, přestane přihrávat a sedí. Která dvojice vydrží nejdéle?

Varianty: Vysoké přihrávky s max. dvěma dotyky pro kontrolu míčku. Vzdálenost lze měnit.

Poznámky: Střídejte dvojice po každém kole, zejména při smíšené úrovni dovedností.', N'Přesné přihrávání.'),
(21, N'Launch Machine', N'Krátká přihrávka, dlouhá přihrávka, útok a střelba – simulace zahájení útoku.

Nastavení: Dva hráči v pravém rohu (1), dva hráči před bránou (2), ostatní v levém rohu (3) na stejné straně. Míčky (mnoho) s hráči před bránou. Brankář v bráně.

Provedení: První hráč na pozici 2 přihraje krátkou přihrávku prvnímu hráči na pozici 3. Hráč na 3 se snaží přihrát přímou přihrávkou, nebo co nejrychleji. Poté přihraje dlouhý pas do cílové oblasti. První hráč na pozici 1 začíná běžet, jakmile je odehrána první přihrávka, a přijme přihrávku v cílové oblasti. Přímá střela nebo rychlé zakončení. Hráči rotují: 1→3, 3→2, 2→1.

Varianty: Po čase zaměňte strany.

Poznámky: Cvičení by mělo být prováděno poměrně vysokou rychlostí.', N'Krátké a dlouhé přihrávky, zahájení útoku.'),
(22, N'Target Game', N'Hráči přihrávají na cíl z různých vzdáleností – postupující hra na přesnost.

Nastavení: Cíl na jedné straně hřiště (malá branka, pro pokročilé dva kužely). Hráči se řadí; vzdálenosti jsou označeny čárami nebo kužely.

Provedení: Hráči střídavě přihrávají na cíl ze středu. Trefí-li cíl, postoupí na další čáru; netrefí-li, zopakují ze stejné čáry. V každém kole každý hráč přihrává jednou.

Varianty: Měnit velikost cíle; pro pokročilé přidat překážku před cílem (povoleny pouze vysoké přihrávky).

Poznámky: Hráči by měli být připraveni přihrávat rychle po předchozím hráči. Trenér může zavést časové limity.', N'Přesné přihrávky.'),
(23, N'Passing Times', N'Základní přihrávky mezi dvěma řadami hráčů.

Nastavení: Hráči rozděleni do dvou řad. Jeden míček na skupinu.

Provedení: První hráč v řadě přihraje míček prvnímu hráči druhé řady a zařadí se zpět na konec. Míček se vrátí zpět atd.

Varianty: Použít dva míčky najednou. Omezit na bekhend nebo vysoké přihrávky.

Poznámky: Při mnoha hráčích rozdělte do samostatných skupin dle úrovně dovedností.', N'Základní přihrávky.'),
(24, N'Run Away', N'Přihrávky ve dvojicích – hráč bez míčku utíká co nejdál, druhý ho musí vidět a přihrát.

Nastavení: Hráči ve dvojicích, jeden míček na dvojici.

Provedení: Hráči běhají po hale a přihrávají si. Hráč, který zrovna nemá míček, se snaží utéct co nejdál od partnera. Hráč přijímající míček se musí podívat nahoru, aby zjistil, kde partner je, a přihrát zpět.

Varianty: Zmenšit hrací plochu pro větší obtížnost. Přidat překážky. Pokročilí hráči mohou zkusit přímé přihrávky.

Poznámky: Hráči si musí dávat pozor, aby do sebe nenarazili.', N'Přihrávání a dívání se nahoru.'),
(25, N'Centralization', N'Jeden hráč stojí, druhý běhá kolem něj – přihrávky na pohyblivý cíl.

Nastavení: Hráči ve dvojicích, 1 míček na dvojici.

Provedení: Jeden hráč stojí; druhý běhá kolem. Míček se přihrává stále dokola.

Poznámky: Přímé přihrávky jsou podporovány. Často vyměňujte role.', N'Rychlé přihrávky na pohyblivý cíl.'),
(26, N'P for Pass', N'Přihrávky po dráze ve tvaru P – hráči rotují za míčkem.

Nastavení: Hráči se řadí na pozici 1 s míčky; jeden hráč každý na pozicích 2, 3, 4 a 5.

Provedení: Přihrávka z 1 na 2, z 2 na 3, z 3 na 4, z 4 na 5. Každý hráč po přihrávce běží na pozici, kam přihrál. Z 5 na 1 hráč jde s míčkem.

Varianty: Přidat kužely nebo překážky mezi 5 a 1. Cvičení lze zmenšit na méně než celé hřiště.

Poznámky: Přihrávky by měly být rychlé a přesné.', N'Přesné přihrávky.'),
(27, N'Stealing Balls', N'Hráči chránní míček, tři hráči bez míčku se snaží míček získat.

Nastavení: Všichni s míčkem; 3 hráči bez míčku.

Provedení: Hráči bez míčku se snaží férově získat míček od ostatních. Pokud hráč přijde o míček, musí získat jiný.

Varianty: Měnit počet hráčů bez míčku; přesun všech hráčů z jedné poloviny hřiště do druhé při současné ochraně míčku. Menší plocha = větší náročnost.

Poznámky: Clonění míčku je užitečné.', N'Cloní míčku; hra 1 na 1.'),
(28, N'Swap Balls', N'Na hvizd všichni položí míček a vezmou jiný – hráč bez míčku hvízdá.

Nastavení: Všichni s míčkem, kromě jednoho hráče bez míčku s píšťalkou.

Provedení: Hráči kontrolují míček a běhají po hale. Hráč bez míčku po chvíli píšťalem. Všichni musí odložit míček a vzít jiný. Hráč bez míčku také vezme míček. Kdo skončí bez míčku, přebírá píšťalku.

Varianty: Dva hráči bez míčku, oba mohou pískat.

Poznámky: Používejte co nejvíce barevných míčků.', N'Kontrola míčku.'),
(29, N'Human Slalom', N'řada hráčů se pohybuje, poslední hráč dělá slalom k čelu řady s míčkem.

Nastavení: Skupiny šesti a více hráčů v řadě, každý s míčkem.

Provedení: řada se pomalu pohybuje jako celek. Hráč nejdále vzadu v řadě dělá slalom (rychle) k čelu. Hráč v čele řady může řídit směr. Jakmile předchozí hráč dosáhne čela, začne běžet další.

Varianty: Lze dělat bez míčků; hráč vzadu nečeká, až předchozí dosáhne čela (více intenzivní).

Poznámky: Toto cvičení je také dobrý trénink. Pro tělesnou kondici lze cvičení provádět bez holí a míčků, ale vyšší rychlostí.', N'Kontrola míčku.'),
(30, N'Master and Slave', N'Jeden hráč driblinuje a snaží se setřást druhého, druhý ho sleduje co nejtěsněji.

Nastavení: Hráči ve dvojicích: jeden master a jeden slave, každý s míčkem.

Provedení: Master driblinuje a snaží se setřást slave. Slave se snaží zůstat co nejblíže masterovi.

Varianty: Master se nesnaží setřást slave, ale snaží se ho donutit ztratit míček. Slave musí co nejpřesněji napodobovat pohyby mastera. Master zkouší obtížné pohyby.

Poznámky: Po čase zaměňte role.', N'Kontrola míčku, dribling.'),
(31, N'Bulldog', N'Hráči s míčky přebíhají přes hřiště, bulldog se je snaží připravit o míček.

Nastavení: Jeden bulldog bez míčku na jedné straně, všichni ostatní s míčkem na druhé straně.

Provedení: Hráči se na signál bulldoga rozběhnou přes hřiště. Bulldog se snaží ukrást nebo odkopnout míček. Hráč, který přijde o míček, se stává pomocníkem bulldoga. Kdo udrží míček nejdéle, vyhrává.

Poznámky: Podporujte pouze fair souboje. Zvažte odvetný zápas.', N'Clonění míčku, udržení míčku pod tlakem.'),
(32, N'Ball Robbery', N'Týmy se snaží získat míčky ze soupeřovy branky a přenést je do vlastní.

Nastavení: Dva týmy. Branky jsou položeny naplocho, v každé stejný počet míčků (např. 20).

Provedení: Týmy se snaží driblinovat s míčkem ze soupeřovy branky a vložit ho do vlastní.

Varianty: Dovolit nebo zakázat obranu vlastní branky. V každém případě hráčům není dovoleno stát v prostoru brankáře.

Poznámky: Hráčům není dovoleno si přihrávat. Brankář není potřeba.', N'Kontrola míčku, běh s míčkem.'),
(33, N'Dump the Balls', N'Každý tým se snaží přihrát nebo vystřelit co nejvíce míčků do soupeřovy poloviny.

Nastavení: Hráči rozděleni do dvou týmů, každý v jedné polovině. Každý hráč dostane jeden míček, stejný počet míčků na každé straně.

Provedení: Týmy se snaží přihrát nebo vystřelit co nejvíce míčků do druhé poloviny. Po několika minutách trenér píšťalem. Tým s méně míčky v své polovině vyhrává.

Poznámky: Při hvizdu všichni zvednou hole nahoru, aby nemohly být odehrány žádné míčky.', N'Florbalové dovednosti.'),
(34, N'Crazy Snakes', N'Hráči tvoří hada, první hráč vede, ostatní sledují s míčky.

Nastavení: Hráči tvoří jednu řadu, každý s míčkem.

Provedení: První hráč v řadě se pohybuje náhodně po hřišti. Ostatní hráči ho sledují a stále kontrolují míček.

Varianty: Zapojit skoky, otočky o 360°, odkládání a sbírání hole nebo střelbu na bránu. Při střelbě všichni střílejí ze stejného místa a pak si vezmou nový míček.

Poznámky: Hráči si musí dávat pozor, aby do sebe nenarazili. Při mnoha hráčích lze vytvořit více hadů.', N'Kontrola míčku, dívání se nahoru.'),
(35, N'Orient Express', N'Hráči driblinují z jednoho bodu na druhý a přihrávají přes celou šíři hřiště.

Nastavení: Míčky pro polovinu hráčů v místě A, hráči v řadách v místech A a B.

Provedení: Hráči se pohybují v kruzích kolem branek. V místě A si vezmou míček a driblinují až do místa B. V místě B přihrají míček přes hřiště hráči v místě A.

Varianty: Přidání překážek mezi A a B. Při menším počtu hráčů zvolit kratší trasu.

Poznámky: Klíčová je přihrávka z B na A. Všichni hráči jsou neustále v pohybu. Po čase změňte směr.', N'Přihrávání z driblingu.'),
(36, N'Tracks', N'Překážková dráha kombinující různé prvky – kužely, lavičky, mantinel, skoky a střelba.

Nastavení: Dráha může být sestavena z mnoha prvků: dribling přes kužely, otočka o 360°, přihrávka od mantinelu, skoky, dribling kolem kuželů, střelba na bránu. Viz tabulku prvků v originálním dokumentu.

Provedení: Hráči střídají v dokončování dráhy.

Varianty: Různé prvky v různém pořadí. Způsob úderu míčku lze omezit (např. žádné tažení, pouze bekhend). Hráči hrající vlevo mohou dělat štafetu s holí v pravo pro zlepšení celkových dovedností.

Poznámky: Hráči nemusí čekat, až předchozí hráč dokončí dráhu. Mnoho drah je vhodných jako rozcvička. Zapojte hráče do tvorby části dráhy.', N'Obecné florbalové dovednosti.'),
(37, N'Destroyers', N'Dva ničitelé se snaží zbavit hráče míčku – zachráněn přihrávkou mezi nohama.

Nastavení: Každý hráč s míčkem, plus dva hráči bez míčku (ničitelé).

Provedení: Hráči driblinují po hřišti a udržují míček pod kontrolou. Ničitelé se snaží odkopnout míček. Hráč, který ztratí kontrolu nad míčkem, zastaví s rozkročenýma nohama. Hráče lze osvobodit, pokud mu jiný hráč přihraje míček mezi nohama.

Varianty: Pro osvobození hráče musí volný hráč přihrát svůj míček mezi nohama druhému volnému hráči. Zvýšit počet ničitelů nebo zmenšit hrací plochu.

Poznámky: Podporujte pouze fair play. Osvobozený hráč si vezme nový míček a přidá se do hry.', N'Kontrola míčku.'),
(38, N'Express Delivery', N'Na zavolání čísla hráči s tímto číslem přeběhnou hřiště a co nejpřesněji položí míček do zóny.

Nastavení: Všichni hráči za danou čárou (A), driblinují. Každý hráč dostane číslo, přičemž číslo sdílí dva nebo tři hráči. Na druhé straně hřiště je označena zóna.

Provedení: Hráči driblinují za čárou. Trenér zavolá číslo. Hráči s tímto číslem přeběhnou hřiště a položí míček do zóny. Míček musí být v klidu uvnitř zóny. Kdo je nejrychlejší?

Varianty: Zapojit hráče za čárou do malé hry. Přidávat překážky na trase (lavičky k přeskoku).

Poznámky: Zóna by měla být malá pro pokročilé hráče.', N'Kontrola míčku při běhu.'),
(39, N'Flash Fingers / Rock-Scissors-Paper', N'Hráč s míčkem sleduje partnera a křičí zobrazenou číslici – trénink dívání se od míčku.

Nastavení: Hráči ve dvojicích, jeden míček na dvojici. Jeden hráč může odložit hůl.

Provedení: Hráč bez hole náhodně běhá po hřišti. Hráč s míčkem ho sleduje a snaží se na něj dívat stále. Hráč bez hole ukazuje prsty (číslo). Hráč s míčkem křičí toto číslo.

Varianty: Hráč bez hole může počítat, kolikrát se partner podívá dolů nebo ztratí míček. Přidat překážky (branky, tašky na hole, krabice). Omezit plochu. Přidat pronásledovatele. Místo prstů ukázat na různé předměty v hale, různě barevné čáry nebo znaky kámen-nůžky-papír.

Poznámky: Pozor, aby hráči do sebe nenarazili, když se příliš soustředí na zobrazené číslice. Měnění rychlosti běhu zvyšuje přínos cvičení.', N'Kontrola míčku bez pohledu na míček.'),
(40, N'Cones and Passes', N'Dribling kuželí a přihrávka partnerovi – přechod z kontroly míčku na přihrávání.

Nastavení: Hráči se řadí na jednom konci haly, míčky v jedné z řad.

Provedení: První dva hráči tvoří dvojici. Použije se pouze jeden míček. Hráči driblinují přes kužely (míček kolem kuželů, hráč okolo) a poté přihrají míček druhému hráči.

Varianty: Měnit počet kuželů a vzdálenost mezi řadami (délku přihrávky).

Poznámky: Hráč, který nedriblinuje, může pomalu klusat. Hráči by si měli po dokončení cvičení vyměnit řady, aby trénovali forhendem i bekhendem. Pokročilejší hráči mohou chtít vyšší rychlosti.', N'Kontrola míčku a přechod k přihrávání.'),
(41, N'The Chase', N'Druhý hráč se snaží dohonit prvního na dráze s kužely – honička s míčky.

Nastavení: Kužely označují dráhu, hráči ve dvojicích, každý s míčkem.

Provedení: První hráč začne driblinovat přes kužely. Jakmile první hráč překročí startovní čáru, druhý hráč začíná. První hráč se snaží dokončit dráhu jako první, druhý se ho snaží dohnat. Při ztrátě míčku se hráč vrátí k poslednímu kuželu, kde měl míček pod kontrolou.

Varianty: Dráhu lze měnit. Sbírání míčku po ztrátě lze zakázat. Startovní čáru lze posunout.

Poznámky: Podle rozmístění lze hráče požádat, aby běželi kolem kuželů s míčkem, nebo aby ho driblinovali skrz. Pokud je dráha dlouhá, na dráhu mohou být vyslány dvě dvojice najednou.', N'Dovednosti s holí pod tlakem.'),
(42, N'Speed Challenge', N'Hráči dokončí dráhu na čas – soutěž v rychlosti.

Nastavení: Dlouhá dráha, všichni hráči v rohu.

Provedení: Hráči střídají ve snaze dokončit dráhu co nejrychleji. čas se zaznamenává. Dráha je dokončena, když je míček doveden do klidu v označené oblasti na konci.

Varianty: Rozmístění dráhy lze měnit.

Poznámky: Při pravidelném vysílání může být na dráze více hráčů najednou. Při ztrátě míčku hráč musí míček přinést a pokračovat tam, kde ho naposledy kontroloval. Lze uvalit časové penalizace za každou ztrátu.', N'Dovednosti s holí.'),
(43, N'Speed Slalom', N'Dva hráči závodí v paralelním slalovém kurzu s míčky.

Nastavení: Dvě identické řady kuželů pro dribling. Hráči ve dvou řadách za kužely, každý s míčkem.

Provedení: Hráči závodí v driblingu přes kužely.

Varianty: časy lze zaznamenávat; nebo lze cvičit formátem vyřazování. Hráči, kteří ztratí míček, mohou být považováni za poražené, začínat znovu od začátku nebo pokračovat od posledního kuželu.

Poznámky: Zajistěte jasně definované startovní a cílové čáry. Hráči musí dodržovat stanovený způsob driblingu.', N'Dovednosti s holí pod tlakem.'),
(44, N'Stamina', N'Hráči driblinují přes kužely, dokud neztratí míček – kdo se dostane nejdál?

Nastavení: Dlouhá dráha z kuželů; hráči v jedné řadě.

Provedení: Hráči driblinují přes kužely, dokud neztratí míček. Kdo se dostal nejdál, vyhrává.

Varianty: Rozmístění dráhy lze měnit.

Poznámky: Aby hráči nešli příliš pomalu, lze zavést časové limity nebo zastavit hráče, jakmile je dohoní následující.', N'Kontrola míčku.'),
(45, N'Hollywood', N'Hráč driblinuje za branou a skrz hráče, pak přihraje do rohu – cvičení 1 na mnoho.

Nastavení: Pět nebo šest hráčů rozmístěno na jedné straně hřiště (2), jeden hráč v rohu (4), ostatní v druhém rohu (1) s míčky.

Provedení: První hráč na (1) vezme míček, driblinuje za bránou a skrz hráče (2). Těsně před posledním hráčem (3) přihraje hráči v rohu (4). Hráči rotují: 4→3, 3→poslední pozice v 2, hráči v 2 postupují o pozici vpřed, první hráč v 2 přejde do řady na 1; hráč startující z 1 zaujme pozici v rohu (4).

Varianty: Po finální přihrávce na (4) lze přidat přihrávku zpět do slotu, aby útočník zakončil střelou.

Poznámky: Hráč přijímající míček na (4) může míčky uchovat, nebo je přihrávat zpět k (1). Hráči na (2) mohou být více nebo méně aktivní při obraně. Hráč, který ztratí míček, se zařadí do řady na (1).', N'Kontrola míčku; přihrávání pod tlakem.'),
(46, N'The Long Shield', N'Hráči driblinují přes kužely a clonění míčku u každého kužele i u reálného obránce.

Nastavení: Hráči rozděleni do dvou skupin, každý s míčkem. Jeden hráč jako obránce, taška na hole na jedné straně hřiště (1).

Provedení: Hráči startují z protilehlých konců a driblinují přes kužely. Míček je chráněn tělem u každého kužele, zejména tam, kde je reálný obránce. Míček je přehozen přes tašku na hole.

Varianty: Zvýšit počet reálných obránců. Hráč, který ztratí míček obránci, může dostat 10 kliků. Vzdálenost mezi kužely lze měnit.

Poznámky: Po čase vystřídejte obránce. Všichni hráči jsou v pohybu najednou.', N'Clonění míčku.'),
(47, N'Directions', N'Trenér ukazuje směr, hráči s míčky ihned mění směr pohybu – trénink dívání se nahoru.

Nastavení: Všichni hráči s míčkem, čelem k trenérovi.

Provedení: Trenér ukáže směr a všichni hráči s míčkem se vydají tímto směrem. Trenér mění směry často a nepravidelně.

Varianty: Trenér může ukázat na konkrétní předměty v hale (brána, dveře) a hráči k nim běží.

Poznámky: Pokročilejší hráči mohou dělat feinty pro zajímavější cvičení.', N'Florbalové dovednosti, pohled nahoru při kontrole míčku.'),
(48, N'Shooting Relay I', N'Dva týmy střídají útoky na brankáře – kdo dá branku, může sedět.

Nastavení: Dva týmy stojí na středové čáře, míčky s hráči.

Provedení: Týmy střídají útoky na brankáře. Při skórování si hráč může sednout, jinak se zařadí zpět do řady. Tým, který jako první skóruje celá řada, vyhrává.

Varianty: Lze aplikovat pravidla penaltového kopu (zákaz tažení míčku dozadu).

Poznámky: Protože hráči střílí vlevo nebo vpravo, cvičení by se mělo opakovat s výměnou stran.', N'Střelba pod tlakem.'),
(49, N'Shooting Relay II', N'Každý tým má 20 míčků – první tým, který vstřelí 20 branek, vyhrává.

Nastavení: Dva týmy se řadí v protilehlých rozích. Každý tým dostane 20 míčků.

Provedení: První hráč každého týmu běží dopředu a střílí před průchodem kužely. Pokud míček jde do branky, branka se počítá. Každý hráč se v každém případě zařadí zpět do řady. Cvičení trvá, dokud jeden tým neskóruje 20 branek. Další hráč může startovat, jakmile hráč před ním skutečně střelí.

Varianty: Počet míčků lze měnit; toto cvičení dává hráčům větší tlak než cvičení 48.

Poznámky: Protože míčky se rozkutálí, počítejte vstřelené branky, ne zbývající míčky.', N'Střelba pod tlakem.'),
(50, N'Long Shooting Relay', N'Jako Shooting Relay II, ale hráč nejprve oběhne protilehlou bránu.

Nastavení: Dva týmy se řadí v protilehlých rozích. Každý tým dostane 20 míčků.

Provedení: První hráč každého týmu běží dopředu, oběhne protilehlou bránu a střílí před průchodem kužely. Cvičení trvá, dokud jeden tým neskóruje 20 branek.

Varianty: Počet míčků lze měnit.

Poznámky: Toto cvičení může být poměrně náročný trénink. Zvažte odvetný zápas.', N'Střelba pod tlakem.'),
(51, N'Single Shooting Relay', N'Štafetová střelba s vlastním míčkem, kužely označují vzdálenost střelby.

Nastavení: Dva týmy se řadí v protilehlých rozích; každý hráč s míčkem. Kužely označují danou vzdálenost od branky.

Provedení: První hráč každého týmu běží dopředu a střílí před průchodem kužely. Cvičení trvá, dokud jeden tým neskóruje 20 branek. Další hráč startuje, jakmile střela odejde.

Varianty: Vzdálenost od branky lze měnit. Kužely lze ponechat poměrně blízko branek, protože brzy střílení urychluje hru.

Poznámky: Toto cvičení může být dobrý trénink. Zvažte odvetný zápas.', N'Střelba pod tlakem.'),
(52, N'Merry Go Round', N'Hráč oběhne půlkruh a dostane přihrávku před bránou – střelba po přihrávce.

Nastavení: Hráči rozděleni do dvou rohů, všechny míčky v rozích.

Provedení: První hráč z rohu B oběhne půlkruh a dostane přihrávku od A před bránou. Hráč, který přihrál od A, pak běží a dostane přihrávku od B. Po střelbě se hráči připojí do řady v protilehlém rohu.

Varianty: Typ střely lze omezit; hráči mohou být povinni střílet bekhendem na jedné straně. Vzdálenost od branky při střelbě lze omezit. Před cvičením rozhodněte, zda jsou povoleny přímé střely nebo nejdříve zachycení a kontrola.

Poznámky: Dbejte na přesné přihrávky a hru forhendem. Pokud hráči neběží dostatečně blízko středové čáry, lze umístit kužely.', N'Střelba.'),
(53, N'Straight Attack', N'Hráči střídají útok přímo na bránu – základní střelecký dril.

Nastavení: Hráči se řadí s míčky.

Provedení: Hráči střídají, každý udělá několik kroků a pak střelí na bránu.

Varianty: Vložit do branky lavičku nebo tašku na hole, čímž hráče nutíte střílet vysoko. Pro soutěžní prvek počítejte vstřelené branky každého hráče.

Poznámky: Při sbírání míčku po neúspěšné střelbě hráči musí dávat pozor na střely ostatních. Udržujte cvičení relativně rychlé. Pro začátečníky lze cvičení dělat i bez brankáře.', N'Střelba.'),
(54, N'Pass to Shoot', N'Přihrávky mezi třemi body zakončené střelou ze slotu.

Nastavení: Hráči se řadí na pozici 1 s míčky; jeden hráč na pozicích 2 a 3.

Provedení: Přihrávka z 1 na 3, z 3 na 2, z 2 do slotu, kde hráč z 1 střílí na bránu. Hráči rotují: 1→2, 2→3, 3→1.

Varianty: Měnit vzdálenost od branky.

Poznámky: Cvičení by mělo být prováděno vysokou rychlostí. Začínejte pomalu a pak zrychlujte. Podporujte přímé přihrávky. Po čase zaměňte strany.', N'Střelba po přihrávce.'),
(55, N'Alternative Merry Go Round', N'Varianta Merry Go Round – přihrávka ze stejného rohu, ne z protilehlého.

Nastavení: Hráči rozděleni do dvou rohů, všechny míčky v rozích.

Provedení: První hráč z rohu B oběhne půlkruh a dostane přihrávku od B (ne od A). První hráč na A pak běží a dostane přihrávku od A. Po střelbě se hráči připojí do řady v protilehlém rohu.

Varianty: Typ střely lze omezit; bekhend na jedné straně. Vzdálenost od branky lze omezit. Rozhodněte o přímých střelách nebo příjmu a kontrole.

Poznámky: Dbejte na přesné přihrávky a hru forhendem.', N'Střelba.'),
(56, N'Merry Go Round with Back Pass', N'Složité cvičení s více přihrávkami, zpětnou přihrávkou a střelou.

Nastavení: Hráči v obou rozích, míčky v obou rozích.

Provedení: První hráč běží z 1 na 2. Přihrávka z 1 na 2. Hráč na 2 přihraje přímou přihrávku na 3, odkud je okamžitě vrácena. Hráč střílí ze 4 a připojí se do řady na 3. Hráč, který přihrál ze 3, běží na 5.

Poznámky: Jako hráč na 1: nejprve přihraješ hráči před sebou (1→2), pak vracíš přihrávku (5→1→4) a pak běžíš (1→2). Začínejte pomalu a pak zrychlujte.', N'Střelba po přihrávce.'),
(57, N'Shoot in Line', N'Hráči se řadí ve stejné vzdálenosti od branky a střílí jeden po druhém.

Nastavení: Hráči se řadí ve stejné vzdálenosti od branky, každý s míčkem.

Provedení: Hráči střílí na bránu jeden po druhém.

Varianty: Hráči startují zleva a pohybují se doprava; nebo zprava doleva; nebo střídají strany. Typ střely lze měnit.

Poznámky: Trenér může určit, kolik střel musí být vstřeleno pro výzvu brankář vs. hráči (např. více než 50% branek = 10 kliků pro brankáře). Dobré jako rozcvička. Začínejte jemnými zápěstními střelami, pak přecházejte na rychlé zápěstní, tažené a slap-shot.', N'Střelba.'),
(58, N'Variations in Line', N'Střídání střelby a útoku z řady hráčů – brankář pod tlakem.

Nastavení: Hráči se řadí ve stejné vzdálenosti od branky, každý s míčkem.

Provedení: První hráč střílí, druhý útočí na brankáře (rychle), třetí střílí, čtvrtý útočí atd.

Varianty: Hráči se pohybují zleva doprava nebo naopak. Typ střely lze měnit. Trenér za bránou může naznačovat střelu nebo útok.

Poznámky: Pokud brankář není v pozici po útoku (např. leží), další hráč musí chvíli počkat.', N'Střelba a útok.'),
(59, N'Shoot Only when Called', N'Trenér volá číslo a daný hráč okamžitě střílí – trénink pohotové střelby.

Nastavení: Hráči se řadí ve stejné vzdálenosti od branky, každý s míčkem. Každý hráč dostane číslo.

Provedení: Trenér zavolá číslo a hráč s tímto číslem střílí. Hráči si po střelbě vymění pozice.

Varianty: Typ střely lze omezit; nebo jednotlivým hráčům přidělit různé typy střel. Někteří hráči mohou být požádáni, aby útočili místo střelby.

Poznámky: Cvičení by mělo být prováděno rychlým tempem. Toto cvičení je náročné pro brankáře, ale zaujmutí pozice je součástí cvičení. časté přestávky pro brankáře.', N'Střelba bez velké přípravy.'),
(60, N'Shoot in Line with Pass', N'Hráč v rohu přihrává libovolnému hráči v řadě, který okamžitě střílí.

Nastavení: Hráči se řadí ve stejné vzdálenosti od branky. Jeden hráč v rohu se všemi míčky.

Provedení: Hráč v rohu přihraje libovolnému hráči v řadě, který okamžitě střílí přímou střelou.

Varianty: Cvičení lze hrát i z druhé strany.

Poznámky: Hráči mohou zvolat, pokud chtějí střílet při nepřesné přihrávce. Brankář musí svou pozici přizpůsobit. Přihrávač je potřeba čas od času vyměnit, protože přihrávky jsou vyčerpávající.', N'Střelba po přihrávce.'),
(61, N'Four Shots', N'Hráč rychle střílí čtyři míčky za sebou ze čtyř kuželů – rychlost střelby.

Nastavení: čtyři kužely v řadě asi 5→10 metrů od branky. Hráči se řadí u mantinelu ve výšce kuželů. U každého kužele je míček.

Provedení: První hráč začíná u kužele nejblíže čáře, střílí a okamžitě přechází k dalšímu míčku atd. Jakmile první míček odejde, druhý hráč v řadě začíná pokládat míček ke každému kuželi. Hráč první v řadě může začít střílet, jakmile předchozí hráč dokončil.

Varianty: Typ střely lze měnit (zápěstní, slap-shot, spin shot). Je možné přiřadit jiný typ střely ke každému kuželi. Po čase zaměňte strany a měřte vzdálenost od branky.

Poznámky: Toto cvičení vyžaduje určitou disciplínu pro udržení tempa. Při mnoha hráčích si hráči v řadě mohou hrát ve dvojicích přihrávkami.', N'Rychlá střelba.'),
(62, N'Shoot as You Are Told', N'Trenér za bránou ukazuje roh, hráč musí přesně střílet – přesná střelba na pokyn.

Nastavení: Hráči se řadí mírně před středovou čárou s míčky. Trenér je za bránou (po straně), aby ho brankář neviděl.

Provedení: První hráč v řadě udělá několik kroků a střílí tam, kam trenér ukáže. Trenér může ukázat libovolný ze čtyř rohů i polo-výšku.

Varianty: Vzdálenost od branky lze měnit.

Poznámky: Hráči, kteří netrefí cíl, mohou dostat kliky. Cvičení funguje i bez brankáře.', N'Přesné střely.'),
(63, N'Shoot as You Are Told with Pass', N'Hráč dostane přihrávku, pak střílí na trenérem ukázaný roh – přesná střelba z přihrávky.

Nastavení: Hráči se řadí mírně před středovou čárou (2) bez míčků, dva hráči v rohu s míčky (1). Trenér je za bránou.

Provedení: První hráč v (1) přihraje prvnímu hráči v (2), který udělal několik kroků. Hráč z (2) střílí tam, kam trenér ukáže.

Varianty: Vzdálenost od branky lze měnit.

Poznámky: Hráči, kteří netrefí cíl, mohou dostat kliky. Funguje i bez brankáře. Pokud hráči obtížně kontrolují míček, lze přidat kužely pro označení posledního místa, odkud lze střílet.', N'Přesné střely po přihrávce.'),
(64, N'Round We Go', N'Hráči běží ve velkém kruhu, přihrávají přes hřiště a střílí přímo – pohybová střelba.

Nastavení: Hráči rozděleni do čtyř skupin na pozicích 1, 2, 3, 4. Míčky za oběma brankami.

Provedení: Hráči běží ve velkém kruhu. Hráč s míčkem přihraje prvnímu hráči bez míčku přes hřiště. Hráč střílí přímou střelou. Po střelbě hráč pokračuje v kruhu a vezme si míček za bránou.

Varianty: Běh v druhém směru.

Poznámky: Pozor při střelbě, aby nebylo zasaženo jiného hráče běžícího za bránou. Jakmile cvičení začne, jednoduše pokračuje, všichni hráči jsou v pohybu najednou.', N'Střelba z pohybu.'),
(65, N'Trick Shot', N'Hráč provede trik u kužele (obránce) a zakončí střelou – protiakce na obránce.

Nastavení: Hráči v řadě v rohu A, jeden hráč na pozici B.

Provedení: Přihrávka z A na B. Na B hráč použije trik k překonání stylizovaného obránce (kužel) a střílí z C. Hráči rotují A→B, B→A.

Varianty: Pro pokročilé hráče lze na pozici B umístit reálného obránce.

Poznámky: Trik by měl zahrnovat clonění míčku, pravděpodobně s otočením. Přihrávka z B na C k obejití kužele může být vhodná. Varianta vlevo: hráč přihraje před kužel, ale otočí se dozadu a oběhne kužel zezadu ke střelbě. Varianta vpravo: hráč přihraje a otočí se zepředu kužele zády k němu.', N'Trik k překonání obránce a střelba.'),
(66, N'Shielded Shot', N'Útočník clonění míčku u obránce a pak střílí na bránu – reálný kontakt.

Nastavení: Všichni hráči v řadě na A s míčky. Jeden hráč jako obránce na B. Brankář v bráně.

Provedení: První hráč v řadě na A běží s míčkem, clonění míčku na B a pak střílí. Po střelbě se útočník stává obráncem a obránce se zařadí do řady na A.

Poznámky: Obránce může volit cokoliv od pasivního stání až po aktivní pronásledování míčku podle dovedností útočníků.', N'Střelba přímo po clonění míčku.'),
(67, N'Back Shot', N'Hráč běží k bráně, druhý mu přihraje zezadu – přímá střela po přihrávce z boku.

Nastavení: Hráči se řadí u středu. Míčky s hráči.

Provedení: První hráč v řadě běží k bráně. Druhý hráč v řadě přihraje zezadu (B) a první hráč (A) střílí přímou střelou. Po přihrávce hráč běží dopředu.

Poznámky: Měřte místa, odkud je řada. Pozor na hru forhendem.', N'Střelba po přihrávce zezadu.'),
(68, N'Cliff-hanger', N'Přihrávka, zpětná přihrávka a přímá střela na bránu – rychlý útok.

Nastavení: Hráči se řadí na středovém bodu s míčky (A). Dva hráči asi 3→5 metrů před řadou (B).

Provedení: Přihrávka z A na B. Hráč, který přihrál, začíná běžet k bráně. Na B je přihrávka vrácena přímo zpět a následuje přímá střela na bránu. Rotace A→B, B→A.

Varianty: Cvičení lze provádět blíže k bráně nebo pod úhlem (hráči startují u mantinelu).

Poznámky: Přihrávky musí být přesné a relativně rychlé. Po čase zaměňte strany.', N'Střelba po krátké zpětné přihrávce.'),
(69, N'Short Machine', N'Přihrávka z rohu na střelce u středové čáry – rychlé přímé střely.

Nastavení: Dva hráči v rohu s mnoha míčky. Ostatní se řadí asi 3 metry před středovým bodem.

Provedení: Přihrávka z rohu na střed, kde první hráč v řadě střílí přímo. Hráči rotují: z rohu (po přihrávce) do středu; ze středu (po střelbě) do rohu.

Varianty: Po čase zaměňte strany. Lze omezit typ střel (slap-shot, tažené).

Poznámky: Pozor na forehand a bekhend při přihrávání. Přímé střely jsou klíčové. Rychlé tempo nutné pro udržení zajímavosti.', N'Přímé střely.'),
(70, N'Two Goal Shooter', N'Hráč dostane přihrávku a těsně před střelou se dozví, na kterou ze dvou branek střílet.

Nastavení: Dvě branky na stejné straně hřiště asi 5 metrů od sebe. Uprostřed branek jeden hráč (A) přihrává. Ostatní hráči v řadě u středu (B). Jeden brankář v každé bráně.

Provedení: Přihrávka od A k prvnímu hráči v B. Hráč v B běží dopředu ke střelbě. Těsně před dopadem míčku k hráči B, hráč A ukáže, na kterou bránu střílet. Hráč B střílí na označenou bránu.

Varianty: Pro urychlení lze mít u A dva hráče – jeden přihrává, druhý ukazuje směr. Hráč ukazující směr může chodit nebo běhat za brankami. Lze použít malé tréninkové branky.

Poznámky: Po čase vyměňte hráče na A. Udržujte tempo pro výzvu brankářům. Funguje i bez brankářů.', N'Střelba s pohledem nahoru.'),
(71, N'Side Shooter', N'Hráč vykročí z řady, dostane krátkou přihrávku a střílí přímo – střelba z krátkého pasu.

Nastavení: Hráči se řadí na středovém bodu bez míčků. Dva hráči s míčky asi 3 metry před řadou.

Provedení: První hráč v řadě u středu vykročí, dostane přihrávku od prvního hráče s míčkem a střílí přímo. Po střelbě se hráč zařadí do řady B; po přihrávce se hráč zařadí do řady A.

Varianty: Vzdálenost od branky a typ střely lze měnit. Vzdálenost přihrávky u B lze také měnit.

Poznámky: Krátké, rychlé a přesné přihrávky jsou nutné. Případně mít tři hráče v B. Po čase zaměňte stranu přihrávek.', N'Střely z krátké přihrávky.'),
(72, N'Double Side Shooter', N'Hráč dostane dvě přihrávky po sobě a dvakrát střílí – dvojitá střelba s pohybem.

Nastavení: Hráči v řadě u středu bez míčků. Dva hráči s polovinou míčků asi 3 metry před řadou, dva hráči asi 2 metry před bránou s druhou polovinou míčků.

Provedení: První hráč v řadě vykročí, dostane přihrávku od B a střílí přímou střelou (1). Hned nato přijde přihrávka od C a přímá střela (2). Hráč se připojí do řady C; po přihrávce u C do řady B; po přihrávce u B do řady A.

Varianty: Vzdálenost od branky a typ střely lze měnit. Lze neomezovat druhou střelu (blízko branky), ale omezit typ první střely.

Poznámky: Krátké, rychlé a přesné přihrávky. Po první střele hráč pokračuje v pohybu. Po čase zaměňte stranu pozic B a C.', N'Střely z krátkých přihrávek.'),
(73, N'Box Shot', N'Hráč střílí, přeskočí krabici a okamžitě střílí znovu – střelba pod tlakem.

Nastavení: Hráči se řadí na A. Míčky na A, C a D.

Provedení: Hráči startují na A, střílí na bránu, přeskočí krabici (B) a ihned střílí na C. Pak si vezmou nový míček na D a slalomem přes kužely se zařadí zpět do řady. Jakmile druhá střela odejde, může startovat další hráč.

Poznámky: Výška krabice lze upravit dle kondice a dovedností hráčů. Po čase zaměňte strany.', N'Střelba pod tlakem.'),
(74, N'Lord of the Ring', N'Obránce brání okruh, útočníci se snaží přihrát nebo vystřelit skrz kruh – poziční obrana.

Nastavení: Tři nebo čtyři kruhy na hřišti (průměr 1→2 metry). Jeden obránce (lord) na každý kruh, jeden nebo dva útočníci na každý kruh. Jeden míček na kruh.

Provedení: Útočníci se snaží přihrát míčky a vystřelit skrz kruhy. Každý obránce chrání svůj kruh ze všech stran.

Varianty: Přidělit dva nebo tři útočníky konkrétnímu kruhu. Alternativně mít pouze dva kruhy a hrát v týmech.

Poznámky: Počet kruhů závisí na počtu hráčů. Obráncům je dovoleno pouze odkopnout míček, ne ho kontrolovat.', N'Obrana zóny.'),
(75, N'Rebound', N'Normální hra s lavičkami místo branek – branka platí pouze pokud spoluhráč zachytí odraz.

Nastavení: Normální florbalová hra, ale místo branek jsou dlouhé lavičky. Brankáři nejsou potřeba.

Provedení: Branka platí pouze tehdy, pokud hráč stejného týmu zachytí odraz a zkontroluje míček.

Varianty: Spoluhráč musí po kontrole míčku znovu střílet, aby branka platila.

Poznámky: Počítají se pouze odrazy z přední části lavičky.', N'Zachycení odrazů.'),
(76, N'Race to Attack', N'Dva hráči závodí o míček – kdo ho dostane, útočí, druhý brání.

Nastavení: Hráči rozděleni do dvou řad na jednom konci hřiště. Jeden hráč mezi řadami přihrává k druhé bráně; všechny míčky s tímto hráčem.

Provedení: První dva hráči čelem dopředu. Hráč přihraje bez varování. Oba závodí o míček. Hráč, který míček dosáhne první, útočí; druhý brání. Cíl útočníka je skórovat.

Varianty: Hráčům lze nařídit, aby si před přihrávkou lehli. Nebo si lehli na záda. Přidat překážku asi 3 metry před řadami (lavičku k přeskoku). Přihrávky mohou být nízké nebo vysoké, nebo střídavě.

Poznámky: Zvláštní pozornost věnujte pravidlům fair bránění.', N'Rychlý útok, obrana pod tlakem.'),
(77, N'One on One', N'Jeden hráč clonění míčku, druhý se ho snaží vzít – intenzivní souboj.

Nastavení: Dva hráči, jeden míček na dvojici.

Provedení: Hráč s míčkem se snaží míček chránit. Druhý hráč se snaží míček sebrat.

Varianty: Ohraničit plochu pro každou dvojici, případně kužely.

Poznámky: Toto cvičení je intenzivní, takže zahrřte přestávky každé jednu nebo dvě minuty. Povolovat pouze fair souboje.', N'Bránění míčku.'),
(78, N'Shield Doctors', N'Hráči driblují kolem dvou obránců, přičemž clonění míčku.

Nastavení: Hráči se řadí s míčky, dva obránci bez míčku.

Provedení: Hráči střídají dribling kolem obránců, přičemž dbají na clonění míčku. Na druhém konci tvoří novou řadu a cvičení se opakuje z druhé strany.

Poznámky: Dle úrovně dovedností hráčů jsou obránci více nebo méně aktivní. Po každém kole vyměňte obránce.', N'Clonění míčku.'),
(79, N'Timed Attack', N'Tři útočníci se snaží co nejvíce nastřílet za 2 minuty proti dvěma obráncům.

Nastavení: Jeden časovač v rohu s míčky. Tři útočníci na středové čáře, dva obránci.

Provedení: časovač vystřelí míček k útočníkům, kteří musí co nejvíce nastřílet za 2 minuty. Obránci mohou míček odkopnout nebo ho podržet.

Varianty: Zakázat obráncům držení míčku.

Poznámky: Dva týmy mohou soutěžit, hraje-li se na dvou polovinách hřiště.', N'Rychlý útok.'),
(80, N'2→1 Attack', N'Dvojice útočníků vs. jeden obránce – přehrání obránce a zakončení.

Nastavení: Jeden obránce a dvojice útočníků. Útočníci se řadí na středové čáře.

Provedení: Útočníci se snaží obehrát obránce a skórovat.

Poznámky: Obránce se snaží zachytit míček, ale pouze fair souboje. Při neúspěchu nebo ztrátě míčku nastupuje další dvojice. Cvičení musí být rychlé. Útočník, který střelil nebo naposledy kontroloval míček, se stává obráncem v dalším kole.', N'Útok s obráncem.'),
(81, N'Deflections', N'Hráč střílí, spoluhráč před bránou se snaží přesměrovat míček do sítě.

Nastavení: Hráči se řadí na středovém bodu, jeden hráč před bránou těsně za prostorem brankáře. Jeden hráč čeká vedle branky.

Provedení: První hráč v řadě střílí na bránu, míček by měl být asi ve výšce kolen hráče před bránou. Hráč před bránou se snaží přesměrovat míček do sítě. Po přesměrování se hráč zařadí do řady u středu. Hráč vedle branky zaujme pozici před bránou. Střelec doběhne k bráně.

Poznámky: Přesměrování jsou vždy přímá.', N'Přesměrování střel.'),
(82, N'Slot Game', N'Hráč ve slotu přesměrovává přihrávky z pěti různých řad – trénink přesměrování.

Nastavení: Jeden hráč ve slotu bez míčku. Pět řad s míčky pro přihrávání. Kužely označují pozice řad.

Provedení: Hráči v řadách střídají přihrávky hráči ve slotu. Hráč ve slotu se snaží přesměrovat přihrávku do branky. Po pěti přihrávkách zaujme slot nový hráč.

Varianty: Trenér může určit, ze které řady se přihrává. Lze použít vysoké přihrávky.

Poznámky: Cvičení by mělo být relativně rychlé. Lze rotovat plynule: první hráč, který přihrál, bude příště ve slotu; ostatní přihrávači se přesunou do sousední řady; hráč ze slotu přejde do řady nejdál.', N'Přesměrování.'),
(83, N'Free Slot', N'Hráč ve slotu se zbavuje pasivního obránce otočením a hráč mu pak přihraje ke střele.

Nastavení: Jeden hráč každý na pozici 2 a 3; všichni ostatní na pozici 1. Všechny míčky na pozici 1.

Provedení: Cílem je přihrát z (1) na hráče (3) s krátkou střelou. Hráč na (3) čelem k (1). Hráč na (2) je pasivní obránce. Hráč na (3) se otočí zády k 2, pak se kutálí kolem obránce. Hráč (1) přihraje rychle, pak střelí do slotu. Rotace: 1→2, 2→3, 3→1.

Varianty: Hráč na (3) může použít libovolný způsob příjmu přihrávky.

Poznámky: Jde o obsazení prostoru ve slotu. Pokročilé hráče nechte aktivního obránce. Po čase zaměňte strany.', N'Volný prostor ve slotu pro příjem přihrávky.'),
(84, N'Free-Hit Game', N'Normální hra s náhodně přidávanými volnými kopy pro trénink standardních situací.

Nastavení: Normální florbalová hra.

Provedení: Normální hra s tím, že trenér náhodně a v nepravidelných intervalech přiznává volný kop jednomu z týmů. Cílem je trénink volných kopů z různých pozic i stavění obranné zdi.

Poznámky: Pozor na vzdálenost 3 metrů. Volné kopy by měly být prováděny rychle. Hráči musí pochopit, že volné kopy jsou součástí cvičení, ne hry. Výhodou je diskuse o variantách volných kopů před cvičením.', N'Trénink volných kopů a obranné zdi.'),
(85, N'Deep Pass', N'Dlouhá přihrávka zahajuje útok z hloubky pole – trénink spuštění protiútoku.

Nastavení: Jeden hráč bez míčku na pozici 3; ostatní rozděleni do dvou řad. Míčky v řadě 1. Brankář v bráně.

Provedení: Široká přihrávka od 1. Hráč na 2 běží a kontroluje míček za středovou čárou. Z blízkosti rohu přihraje na pozici 3, odkud střílí. Rotace: 1→2 (po přihrávce); 2→3 (po přihrávce); 3→1 (po střelbě).

Varianty: Vysoká přihrávka na zahájení cvičení. V tom případě lze umístit lavičku do středu hřiště jako překážku pro nízké přihrávky.

Poznámky: Brankář by měl přesunout pozici, aby očekával střelu od hráče běžícího z řady 2.', N'Dlouhá přihrávka k zahájení útoku.'),
(86, N'Drop', N'Přihrávka, zpětná přihrávka a přímá střela – rychlá kombinační akce.

Nastavení: Hráči se řadí na středové čáře, míčky s hráči.

Provedení: První hráč v řadě běží z A do B. Druhý hráč přihraje z A do B, odkud je přihrávka přimo přihrána do C. Druhý hráč běží z A do C a přímo střílí z C. Oba hráči se zařadí zpět do řady u středu.

Varianty: Startovat z různých míst na hřišti.

Poznámky: Začínejte pomalu a zrychlujte.', N'Rychlé přihrávky ke střelbě.'),
(87, N'Drop with Defender', N'Jako Drop, ale s obráncem před bránou – útok po kombinaci.

Nastavení: Hráči na středové čáře, míčky s hráči. Jeden obránce před bránou.

Provedení: Jako Drop, ale hráč z C útočí s obráncem. Hráč, který přihrál na B, se stává obráncem v dalším kole. Oba hráči se zařadí zpět do řady.

Varianty: Startovat z různých míst na hřišti.

Poznámky: Povolujte pouze rychlé útoky pro udržení tempa.', N'Rychlé přihrávky k útoku.'),
(88, N'Tunnel Vision', N'Dvojice útočí tunelem z laviček přímo k bráně – přesné přihrávky v omezeném prostoru.

Nastavení: Dvě lavičky před bránou tvořící tunel. Páry hráčů s jedním míčkem v řadě u středu.

Provedení: Dvojice útočí na bránu přihrávkami. Zakončují velmi blízko branky.

Varianty: Místo laviček kužely. Lavičky lze uspořádat pod úhlem ~30° pro vytvoření trychtýře (prostor se zužuje k bráně).

Poznámky: Žádné střely před vstupem hráče do prostoru brankáře. Brankář nesmí v tomto cvičení opustit prostor brankáře.', N'Přesné přihrávání a zakončení v omezeném prostoru.'),
(89, N'The Free-Hit Machine I', N'Dva hráči provádí volný kop na dva obránce tvořící zeď – trénink standardní situace.

Nastavení: Hráči se řadí u středu. Označené místo pro volný kop mezi středovou čárou a bránou. Dva obránci tvoří zeď.

Provedení: První dva hráči provedou volný kop. Mohou zvolit, na které straně zdi hrají. Po střelbě se útočníci stávají obránci. Předchozí obránci se zařadí do řady.

Varianty: Místo volného kopu lze měnit. Při vzdáleném volném kopu pravděpodobně bude pouze jeden obránce. Místo zdi hráčů lze použít krabici.

Poznámky: Cvičení lze provádět na obou branách najednou. Brankář není nutný, ale je přínosný pro pokročilé. Dbejte na správnou vzdálenost od místa volného kopu.', N'Provedení volných kopů a stavění obranné zdi.'),
(90, N'The Free-Hit Machine II', N'Hráč přihraje k jednomu z hráčů vedle imaginární zdi, kteří střílí – trénink volných kopů z různých pozic.

Nastavení: Hráči rozděleni do skupin 4→6. Jeden hráč zvolí místo na hřišti pro emulovaný volný kop. Mnoho míčků. Imaginární obranná zeď, ostatní hráči ve dvou řadách po stranách zdi.

Provedení: Hráč provádějící volný kop přihraje krátce, rychle a přesně prvnímu hráči v jedné z řad, který střílí přímo.

Varianty: Měnit místo na hřišti.

Poznámky: Lze umístit reálnou zeď nebo krabici. Cvičení by mělo být v rychlém tempu. Po vyčerpání míčků vyměňte hráče provádějícího volný kop.', N'Volné kopy z různých pozic.'),
(91, N'Launch Pad', N'Pět přihrávek a pak široký pass pro přímou střelu z dálky.

Nastavení: Dvě řady na jedné straně hřiště, jedna řada s míčky (A).

Provedení: První hráč v řadě A a první v řadě B si přihrají 3krát. Přihrávky jsou rychlé a přesné. Po páté přihrávce hráč B přihraje široce pro hráče A. Hráč A běží a pokud možno přímo střílí.

Varianty: Místo 3 přihrávek pouze 1. řady mohou být blíže u sebe pro 5 rychlých přihrávek.

Poznámky: Po čase zaměňte strany. Druhý pár v řadě může začít přihrávat dříve.', N'Široké přihrávky a přímá střela.'),
(92, N'Launch Pad with Turn', N'Jako Launch Pad, ale po širokém pasu hráč A přihraje do slotu ke střele.

Nastavení: Dvě řady na jedné straně hřiště, jedna řada s míčky (A).

Provedení: Jako Launch Pad. Po širokém pasu hráč A vezme míček pod kontrolu, otočí se a přihraje do slotu, kde druhý hráč přímo střílí.

Varianty: Místo 3 přihrávek pouze 1.

Poznámky: Po čase zaměňte strany.', N'Široké přihrávky a přímá střela.'),
(93, N'Pass from Behind', N'Přihrávka zezadu k útočícímu hráči – přímá nebo rychlá střela.

Nastavení: Dvě řady před jednou bránou, obě s míčky.

Provedení: První hráč řady B běží, přihrávka od A je odeslána krátce po startu, aby ji B mohl zachytit kousek za středovou čárou. Hráč se snaží střílet přímo nebo po jednom dotyku. Hráč, který přihrál (A), se stává dalším běžícím hráčem a dostane míček od (B).

Varianty: Vysoké přihrávky místo nízkých. Omezit na jeden nebo dva dotyky. Místo normálních střel spin shot.

Poznámky: Hráči musí přihrávat na stranu běžícího hráče. Pokročilí věnují pozornost forehand a bekhend.', N'Přihrávka zezadu s rychlým zakončením na bránu.'),
(94, N'Counter Attack', N'Rychlý protiútok s dlouhou přihrávkou a přímou střelou – trénink rychlé akce.

Nastavení: Dvě řady, jedna s míčky (B).

Provedení: První hráč řady B běží bez míčku. Zároveň první hráč řady A běží paralelně na druhé straně. Druhý hráč řady B přihraje dlouhý pas za středovou čáru. Míček se přihraje přímo druhému hráči, který přímo střílí. Přihrávající hráč začíná příště běžet. Oba běžící hráči si po cvičení vymění řady.

Varianty: Druhá řada (A) může být uprostřed. Dva útočníci mohou alternativně útočit na brankáře místo přímé přihrávky.

Poznámky: Celé cvičení musí být prováděno značnou rychlostí.', N'Rychlý a rozhodný protiútok, rychlé a přesné přihrávky.'),
(95, N'Counter Attack with Defender', N'Protiútok 2 na 1 – jeden hráč spustí dlouhý pas a stává se obráncem.

Nastavení: Dvě řady, všechny míčky v řadě B.

Provedení: První hráč řady B (3) je připraven k běhu. Druhý hráč řady B (2) spustí cvičení dlouhým pasem na bod C. Zároveň hráč 1 (řada A) a první hráč řady B (3) běží k protiútoku. Hráč 2 běží a stává se obráncem. Hráči 1 a 3 útočí s obráncem 2.

Varianty: řada A může být uprostřed přímo před bránou místo v rohu.

Poznámky: První pas musí být dostatečně rychlý. Útočníci musí rychle zakončit, jinak je cvičení zrušeno. Hráči si po každém kole vymění pozice.', N'Rychlý a rozhodný protiútok se zakončením, rychlé přihrávky.'),
(96, N'1 on 1 with Pass', N'Hráč dostane přihrávku zezadu u středu a útočí 1 na 1 na obránce z rohu.

Nastavení: Jedna řada s míčky před jednou z branek. Jeden hráč v protilehlém rohu.

Provedení: První hráč v řadě běží a přijme přihrávku zezadu od druhého hráče. Míček by měl být přijat kolem středového bodu. Při přihrávce hráč v rohu jde dopředu jako obránce. Souboj 1 na 1. Útočník jde do rohu k obraně v dalším kole; přihrávač začíná příště běžet.

Varianty: Vyměnit rohy pro obránce a startovat v rohu místo před bránou (útok ze strany).

Poznámky: Útočník musí rychle zakončit, jinak je cvičení zrušeno.', N'Přihrávka zezadu, útok 1 na 1.'),
(97, N'Short Shot', N'Hráč dostane krátkou přihrávku a přímo střílí – simulace základního volného kopu.

Nastavení: Skupiny 5 nebo více hráčů. Jeden hráč s mnoha míčky na daném místě hřiště. Ostatní v řadě max. 1→2 metry od hráče se stejnou vzdáleností k bráně. Nastavení jako při volném kopu.

Provedení: Hráč s míčky přihraje prvnímu hráči v řadě, který přímo střílí. Po střelbě se hráč zařadí do řady na 2.

Varianty: Měnit strany a pozice na hřišti. Různé typy střel.

Poznámky: Cvičení lze hrát na obě branky najednou. Hráče s míčky je třeba občas vyměnit. Cvičení ve vysokém tempu.', N'Krátká přesná přihrávka s přímou střelou, jako při základním volném kopu.'),
(98, N'Four Seasons', N'Normální hra se čtyřmi brankami v rozích – hráči se učí rozptýlit po hřišti.

Nastavení: Normální florbalová hra, ale se čtyřmi brankami, jedna v každém rohu.

Provedení: Normální florbal, každý tým brání dvě branky.

Varianty: Dva nebo více míčků pro zvýšení intenzity.

Poznámky: Pokud chybí dostatek branek, lze použít kužely. Brankáři mohou měnit branky, ale platí normální florbalová pravidla.', N'Hráči se naučí rozptýlit po hřišti.'),
(99, N'Extra Ball', N'Normální hra se dvěma míčky najednou – náročnější taktická varianta.

Nastavení: Normální florbalová hra.

Provedení: Normální hra, ale v hřišti jsou dva míčky najednou.

Varianty: Hrát se třemi, čtyřmi, dokonce pěti míčky najednou.

Poznámky: Jinak platí normální florbalová pravidla.', N'Florbal se dvěma míčky.'),
(100, N'Tunnel Game I', N'čtyři kuželové branky v rozích – branky platí přihrávkou skrz kužele s přijetím.

Nastavení: Normální florbalová hra, ale se čtyřmi brankami v rozích označenými kužely.

Provedení: Normální florbal. Branky jsou dány přihrávkou skrz kužely (a úspěšným přijetím).

Varianty: Dva nebo více míčků. Před začátkem ujasnit, zda opakovaná přihrávka skrz stejný pár kuželů počítá jako více branek nebo zda musí být zapojena jiná přihrávka.

Poznámky: Pozice branek lze měnit.', N'Hráči se naučí rozptýlit a nabídnout se pro přihrávky.'),
(101, N'Tunnel Game II', N'Normální hra s centrálním tunelem z laviček – míček musí projít středním kanálem.

Nastavení: Lavičky vytvářejí tunel ve středu hřiště. Jinak normální florbalová hra.

Provedení: Dva týmy hrají normální florbal, ale míček musí projít centrálním kanálem (tunelem).

Varianty: Zúžit tunel pro obtížnější cvičení.

Poznámky: Další lavičky lze přidat tak, aby obejití tunelu nebylo možné. Vysoké přihrávky pro obejití tunelu nejsou povoleny.', N'Protiútoky pod tlakem a v omezeném prostoru.'),
(102, N'Prison Game', N'Hráči jsou přiřazeni do zón a nesmí je opustit – trénink pozičního florebalu.

Nastavení: Hráči jsou přiřazeni do konkrétních zón. V každé zóně je jeden hráč z každého týmu.

Provedení: Normální florbal s tím, že hráči nesmí opustit svou zónu. Překročení čáry = volný kop pro soupeře.

Varianty: Dle potřeb týmu může být určité překrytí zón. Počet hráčů na poli lze omezit na 4. Při velké různorodosti dovedností lze zóny zmenšit a umožnit 2 hráče z každého týmu v každé zóně.

Poznámky: Funguje i bez brankářů.', N'Hra na pozicích.'),
(103, N'Slot Play', N'Normální hra – branky platí pouze z přihrávky zvenčí slotu.

Nastavení: Normální florbalová hra.

Provedení: Normální hra, ale branky platí pouze po přihrávce zvenčí slotu.

Varianty: Hrát pouze na jednu bránu, restartovat od středu nebo rohu, když obránci kontrolují míček. Případně snížit počet obránců.

Poznámky: Vyloučeny branky z driblingu nebo odrazů. Před začátkem definujte oblast slotu.', N'Přihrávky do slotu.'),
(104, N'One Touch Play', N'Normální hra – každý hráč smí míček dotknout pouze jednou.

Nastavení: Normální florbalová hra.

Provedení: Každý hráč smí míček dotknout pouze jednou. Druhý dotek = volný kop pro soupeře.

Varianty: Dovolit dva dotyky.

Poznámky: Obvykle nebudete chtít dovolit zastavení nohou.', N'Přihrávání.'),
(105, N'Chicken Play Floorball', N'Normální hra – všichni hráči skáčou na jedné noze.

Nastavení: Normální florbalová hra.

Provedení: Hráči skáčou na jedné noze.

Varianty: Hráči na jedné noze skáčou pouze při hře s míčkem. Obránce musí skákat, pokud chce hrát míček. Místo skoků mohou hráči bez míčku dělat žabí skoky.

Poznámky: Toto cvičení je intenzivní, takže je také dobrý trénink. Zvyšte počet hráčů nebo zmenšete hřiště.', N'Koordinace.'),
(106, N'One-Armed Bandits', N'Normální hra – hráči smí hrát pouze jednou rukou.

Nastavení: Normální florbalová hra.

Provedení: Hráči smí hrát míček pouze jednou rukou.

Varianty: Omezit, která ruka smí být použita, nebo zda lze hůl držet pouze na samém konci nebo jen na spodní části gripu.

Poznámky: V normálních zápasech by jednoruká hra neměla být podporována.', N'Ovládání hole.'),
(107, N'Space', N'Normální hra s pouze třemi hráči na každé straně – trénink otevírání prostoru.

Nastavení: Normální florbalová hra, pouze tři hráči v poli na každé straně.

Provedení: Normální florbalová hra.

Poznámky: Toto cvičení je vyčerpávající a střídání by mělo být časté.', N'Otevírání prostoru, pohled nahoru.'),
(108, N'Crowded House', N'Každý hráč brání vlastní míček a snaží se vytlačit ostatní z omezeného prostoru.

Nastavení: Omezit hrací plochu na asi třetinu hřiště, nesmí sahat k mantinelům. Každý hráč s míčkem.

Provedení: Hráči se snaží udržet svůj míček uvnitř hrací plochy a zároveň se snaží vytlačit míčky ostatních ven. Hráč, jehož míček opustí plochu, vyřazuje. Kdo vydrží nejdéle, vyhrává.

Poznámky: Hrací plocha musí být ze začátku přeplněná. Netolerolujte nesprávné souboje nebo strčení.', N'Kontrola míčku a clonění.'),
(109, N'Straitjacket', N'Normální hra – hráči musí celou dobu držet hůl za zády.

Nastavení: Normální florbalová hra.

Provedení: Hráči musí celou dobu držet hůl za zády. Míčky jsou přihrávány holí drženou za zády.

Varianty: Dovolit běh s holí před tělem, ale při souboji s míčkem trvat na hře za zády.

Poznámky: Může to být pro některé hráče nepohodlné, ale florbalové dovednosti se zlepšují. Pokročilejší hráči to mohou shledat obtížnějším než začátečníci.', N'Koordinace.'),
(110, N'Tennis Floorball', N'Normální florbal s tenisovým míčkem místo florbalového – náročnější kontrola míčku.

Nastavení: Normální florbal.

Provedení: Hra se hraje normálně, ale místo florbalového míčku se používá tenisový míček.

Varianty: Vhodné jsou i jiné podobně velké míčky, např. baseballové.

Poznámky: Dle dovedností hráčů mohou být nutná omezení střelby a vysokých míčků, protože tenisový míček může být nebezpečný při silném udeření.', N'Hra s jiným míčkem.'),
(111, N'Central Game', N'Normální hra s brankami uprostřed hřiště – trénink hry kolem slotu.

Nastavení: Normální florbalová hra, ale branky jsou umístěny ve středu hřiště.

Provedení: Normální florbalová hra mezi dvěma týmy s brankami uprostřed.

Poznámky: Zvažte prostory brankáře při hře. Cílem by mělo být přihrávání před slotem.', N'Hra kolem slotu.'),
(112, N'1-2-3 Attack', N'Postupné vlny útoku – 1 na 0, pak 2 na 1, pak 3 na 2 – obránci rotují z útočníků.

Nastavení: Tři řady těsně za středovou čárou, míčky rozděleny. Brankář v bráně.

Provedení: (1) První hráč z řady 2 útočí solo. Po dokončení se otočí a stává se obráncem. (2) První hráči z řad 1 a 3 útočí 2 na 1. Po skórování nebo minutí obránce odejde; útočníci se stávají obránci. (3) První hráči ze všech tří řad útočí 3 na 2. Útok skončí po první střele.

Poznámky: Cvičení by mělo být relativně rychlé. Při neúspěšné střelbě je útok ukončen. Pokud útočníci ztratí míček nebo uvíznou v rohu, útok lze zavolat. Další vlna může startovat, jakmile odejde předchozí střela.', N'Útok v různých formacích.'),
(113, N'Floorball Football 1', N'Hráči hrají florbal a fotbal zároveň – dva míče, dvoje pravidla.

Nastavení: 1 fotbalový míč, 1 florbalový míč; hráči rozděleni do dvou týmů, každý s florbalovou holí.

Provedení: Hráči hrají florbal a fotbal současně.

Poznámky: S fyzicky silnými hráči se nedoporučuje, protože se ničí sítě. Místo fotbalového míče lze použít druhý florbalový míč jiné barvy. Každý míč se řídí příslušnými pravidly.', N'Koordinace.'),
(114, N'Handball Zone', N'Normální hra – ve střední třetině hřiště musí hráči hrát rukama.

Nastavení: Normální florbalová hra.

Provedení: Normální hra, ale ve střední třetině musí hráči hrát rukama.

Varianty: Hrát nohama ve střední třetině; nebo v polovinách (nezapomenout střídat). Hráče, kteří zůstávají příliš dlouho ve stejné zóně, lze penalizovat.

Poznámky: Branky nelze dávat rukama. Míček musí být dotčen v zóně (nestačí jen proletět).', N'Koordinace.'),
(115, N'Hand Game', N'Normální hra – všechny přihrávky musí být vysoké a zachycené rukou.

Nastavení: Normální florbalová hra.

Provedení: Normální hra, ale všechny přihrávky musí být vysoké a zachycené rukou. Po zachycení se pokračuje holí. Pokud míček spadne, volný kop pro soupeře.

Poznámky: Pozor na vysoké hole. Hráči musí vědět, že v normální hře nejsou přihrávky rukou povoleny.', N'Koordinace.'),
(116, N'Floorball Football 2', N'Hra rozdělena na zóny – ve střední zóně platí fotbalová pravidla, na krajích florbalová.

Nastavení: Hráči rozděleni do dvou týmů, každý s holí a jedním míčem. Hřiště rozděleno na tři zóny: dvě florbalové (A) a fotbalová (B) uprostřed.

Provedení: Normální florbal s fotbalovými pravidly ve střední zóně.

Poznámky: V fotbalové zóně smí hráči hrát pouze nohama (hlavičky povoleny). Ve florbalových zónách platí normální florbalová pravidla. Přihrávka nohou do fotbalové zóny není povolena, ale ze střední zóny do florbalové ano.', N'Koordinační dovednosti.'),
(117, N'Penalty in Turn', N'Hráči střídají penalty – kdo netrefí, vypadá; kdo trefu, hraje dál.

Nastavení: Hráči se řadí na střed, každý s míčkem.

Provedení: Hráči střídají penaltové střely. Neuspěchne-li, vypadá; uspěje-li, zařadí se zpět do řady. Opakuje se, dokud není vítěz.

Varianty: Hráči, kteří trefí tyč, mohou dostat jednu druhou šanci.

Poznámky: Platí normální pravidla (zákaz tažení dozadu, zákaz druhé střely).', N'Penaltové střely.'),
(118, N'Penalty Relay', N'Štafetová penaltová hra – hráč oběhne protilehlou bránu a pak střílí penaltu.

Nastavení: Hráči rozděleni do dvou týmů v protilehlých rozích, míčky s hráči. Jeden brankář v každé bráně.

Provedení: První hráč každého týmu běží s míčem, oběhne protilehlou bránu a útočí na bránu na straně svého týmu. Po střele startuje další hráč. Štafeta pokračuje, dokud každý tým neskóruje 10 branek.

Varianty: Hráč, který skóruje, může skončit; kdo nezakončí, zařadí se zpět. Hráč, který dvakrát (nebo třikrát) selže, se zařadí do řady bez ohledu na skórování.

Poznámky: Soupeřící týmy si nesmí překážet. Za středovou čárou platí pravidla penaltového kopu. Pro urychlení může druhý hráč startovat, jakmile první zcela přejde protilehlou bránu.', N'Penaltové střely pod tlakem.'),
(119, N'Short Penalty Relay', N'Střídavá penaltová střelba dvou týmů ze středového bodu – 10 branek jako cíl.

Nastavení: Hráči rozděleni do dvou týmů za středovým bodem. Míčky s hráči. Jeden brankář.

Provedení: První hráč týmu A střelí penaltu ze středového bodu. Pak první hráč týmu B. Pokračuje se, dokud každý tým neskóruje 10 branek.

Varianty: Hráč, který skóruje, může skončit; kdo nezakončí, zařadí se zpět. Alternativně, pokud jsou dva brankáři a mnoho hráčů, týmy střílí na různé branky najednou.

Poznámky: Odvetné zápasy jsou oblíbené. Brankáři jsou vyměněni, pokud jsou dva.', N'Penaltové střely.'),
(120, N'Attack Lines', N'Dvě řady střídají střelbu a útok – brankář pod tlakem rychlého střídání.

Nastavení: Dvě řady přibližně v půli vzdálenosti mezi středovou čárou a bránou. Míčky s hráči.

Provedení: Hráči střídají: z levé řady střelba po několika krocích, z pravé řady útok na brankáře. Hráči se pak přesunou do druhé řady.

Varianty: Obě řady mohou náhodně střílet nebo útočit; nebo trenér za bránou naznačuje.

Poznámky: Po čase zaměňte střeleckou a útočnou řadu. Dvě řady zajišťují, že brankář musí znovu zaujmout pozici po každém útoku. Rychlé tempo.', N'Pozice brankáře pod tlakem.'),
(121, N'Line Game', N'Hráči střílí z různých vzdáleností a postupují vpřed při trefě – soutěž se vzdálenostmi.

Nastavení: Hráči se řadí ve stejné vzdálenosti od branky, začínající asi 1 metr před bránou. Vzdálenosti označeny čárami nebo kužely.

Provedení: Hráči střílí po jednom. Trefí-li, postoupí na další čáru; netrefí-li, opakují ze stejné čáry. V každém kole každý hráč střílí jednou. Hráči nejblíže bráně střílí první.

Varianty: Typ povolené střely lze omezit.

Poznámky: Brankář musí zůstat na brankové čáře, zejména při střelách z velmi blízka. Hráči se po střelbě přesunou, aby ostatní mohli střílet. Hra může pokračovat, dokud hráč nedosáhne určité čáry, nebo daný čas.', N'Střelba z různých pozic.'),
(122, N'Jump Attack', N'Brankář se přepíná mezi dvěma brankami přeskakováním krabice – extrémní kondice brankáře.

Nastavení: Dvě branky na jedné straně hřiště. Krabice nebo lavička uprostřed. Dvě řady u středové čáry s míčky.

Provedení: Brankář začíná v levé bráně. První hráč z levé řady útočí. Jakmile útok skončí, brankář přeskočí krabici a zaujme pozici v pravé bráně. První hráč z pravé řady již útočí. Pak přeskočí zpět atd.

Varianty: řady mohou být blíže k bráně. Místo útoku lze střílet. Krabice může být vyšší. Trenér může označovat jednotlivé hráče pro střelbu nebo útok.

Poznámky: Toto cvičení je náročné pro brankáře, takže zahrřte přestávky. Přesto rychlé tempo.', N'Zaujmutí pozice.'),
(123, N'Double Vision', N'Střelba střídavě z dvou řad – brankář se musí rychle přesouvat.

Nastavení: Dvě řady hráčů asi 5 metrů od sebe, přibližně v půli hřiště. Míčky s hráči.

Provedení: Hráči střídají střelbu z levé a pravé řady. Hráči se přesunou do druhé řady po střelbě.

Varianty: Cvičení se třemi řadami. Vzdálenosti a rozestupy řad lze měnit. Trenér za bránou naznačuje, která strana střílí.

Poznámky: Rychlé tempo – brankáři zbývá jen dost času zaujmout pozici.', N'Pozice brankáře.'),
(124, N'Round the Goal', N'Po každém útoku brankář oběhne bránu a vrátí se čelit dalšímu útočníkovi.

Nastavení: Hráči se řadí na středovém bodu s míčky.

Provedení: První hráč útočí na brankáře. Jakmile brankář ubránil, oběhne bránu. Zatímco oběhá, další útočník začíná útok.

Varianty: Dvě variace: dva brankáři, jeden v bráně a jeden za ní (urychluje cvičení). Vzdálenost k bráně lze zkrátit. Lze střílet místo útočit.

Poznámky: Brankář střídá, ze které strany oběhne bránu.', N'Pozice brankáře.'),
(125, N'Thrower', N'Brankář chytí vysoký pas, vyhodí míček, hráč oběhne protilehlou bránu a střílí.

Nastavení: Hráči s míčky v rohu (A). Brankář v bráně (B).

Provedení: Vysoký pas z A na brankáře. Brankář vyhodí míček. Hráč, který přihrál, běží pro míček za středovou čáru (C), oběhne protilehlou bránu (D) a střílí těsně za středovou čárou (E).

Varianty: Lze cvičit i z druhého rohu. Místo vysokého pasu lze použít nízký pass na brankáře.

Poznámky: Druhý hráč může startovat, jakmile první kontroluje míček mezi C a D. Pro brankáře: chytí vysoký pas – vyhodí – ubrání střelu – chytí – vyhodí atd. Pozn.: v zápase není pass na brankáře povolen.', N'Vyhazování; pozice v bráně.'),
(126, N'Quick Thrower', N'Jako Thrower, ale s druhým brankářem v protilehlé bráně – rychlé zakončení.

Nastavení: Hráči s míčky v rohu (A). Jeden brankář v každé bráně.

Provedení: Vysoký pas z A na brankáře (B). Brankář vyhodí míček. Hráč běží pro míček za středovou čáru (C) a co nejrychleji zakončuje na protilehlou bránu (D). Hráči se shromažďují v rohu (E).

Varianty: Určit limity, odkud hráč musí střílet (dřívější zakončení). Místo vysokého pasu nízký pass na brankáře.

Poznámky: Druhý hráč může startovat, jakmile první přijímá míček na C. Výhoz by měl být k mantinelu (C), aby hráč musel přejet celé hřiště.', N'Vyhazování.'),
(127, N'Goalkeeper versus Team I', N'Hráči střílí v sérii, více než polovina branek = brankář dělá kliky, jinak hráči.

Nastavení: Hráči v řadě před bránou, každý s jedním míčkem.

Provedení: Hráči střídají střelbu. Trenér počítá branky. Po kole: více než polovina = 10 kliků pro brankáře; méně = 10 kliků pro každého hráče.

Varianty: Penalizaci lze měnit; typ střely a vzdálenost lze určit; střídá se střelba a útok; hráči střílí jednou zprava a jednou zleva.', N'Soutěž brankáře vs. tým.'),
(128, N'Goalkeeper versus Team II', N'Hráči střílí jeden po druhém – brankář dělá kliky za každou gólem, hráč za každou minulostu.

Nastavení: Hráči v řadě před bránou, každý s jedním míčkem.

Provedení: Hráči střídají střelbu. Pokud hráč skóruje, brankář oběhne bránu. Pokud hráč netrefí, dělá 5 kliků.

Varianty: Penalizaci lze měnit; typy střel a vzdálenosti lze měnit.

Poznámky: Toto cvičení lze kombinovat s cvičením 127 – na konci každého kola se penalizuje tým brankáře navíc.', N'Soutěž brankáře vs. tým.');

-- 1) Zajistit existenci tagů pro distinct hodnoty "cíl" (přeskočí ty, co v [Tags] už existují dle Name)
INSERT INTO [dbo].[Tags] ([Name], [Color], [IsTrainingGoal])
SELECT DISTINCT i.Cil, '#858791', 0
FROM #Import i
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[Tags] t WHERE t.Name = i.Cil);

-- 2) Vložit aktivity (IsDraft = 1, viz poznámka v hlavičce skriptu)
INSERT INTO [dbo].[Activities] (
    [Name], [Description], [PersonsMin], [PersonsMax], [GoaliesMin], [GoaliesMax],
    [DurationMin], [DurationMax], [Intensity], [Difficulty], [PlaceWidth], [PlaceLength],
    [Environment], [IsDraft], [CreatedAt]
)
SELECT
    i.Nazev, i.Popis, 1, 30, 0, 0,
    1, 60, 1, 1, 1, 1,
    0, 1, @ImportBatch
FROM #Import i;

-- 3) Propojit nově vložené aktivity s příslušným tagem (cíl) přes ActivityTags
-- Spárování probíhá přes (CreatedAt = @ImportBatch AND Name = Nazev), což jednoznačně
-- vybere jen aktivity vložené tímto skriptem (názvy cvičení jsou v rámci dávky unikátní).
INSERT INTO [dbo].[ActivityTags] ([ActivityId], [TagId])
SELECT a.Id, t.Id
FROM [dbo].[Activities] a
JOIN #Import i ON i.Nazev = a.Name AND a.CreatedAt = @ImportBatch
JOIN [dbo].[Tags] t ON t.Name = i.Cil;

DROP TABLE #Import;

COMMIT TRANSACTION;

-- Kontrolní výpis
SELECT COUNT(*) AS ImportedActivities FROM [dbo].[Activities] WHERE CreatedAt = @ImportBatch;
