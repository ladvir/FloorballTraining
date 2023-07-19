using System.ComponentModel;

namespace FloorballTraining.CoreBusiness;

public enum AgeGroup
{
    [Description("Kdokoliv")]
    Kdokoliv = 0,

    [Description("U7 - předpřípravka")]
    U7 = 7,

    [Description("U9 - přípravka")]
    U9 = 9,
    [Description("U11 - elévi")]
    U11 = 11,
    [Description("U13 - ml. žáci")]
    U13 = 13,

    [Description("U15 - st. žáci")]
    U15 = 15,
    [Description("U17 - dorost")]
    U17 = 17,
    [Description("U21 - junioři")]
    U21 = 21,
    [Description("Dospělí")]
    Dospeli = 23
}