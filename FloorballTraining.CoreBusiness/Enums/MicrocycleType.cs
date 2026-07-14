using System.ComponentModel;

namespace FloorballTraining.CoreBusiness.Enums;

public enum MicrocycleType
{
    [Description("Rozvíjející")]
    Development = 0,
    [Description("Stabilizační")]
    Stabilization = 1,
    [Description("Vylaďovací")]
    Tapering = 2,
    [Description("Regenerační")]
    Regeneration = 3,
    [Description("Soutěžní")]
    Competition = 4
}
