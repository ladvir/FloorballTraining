using System.ComponentModel;

namespace FloorballTraining.CoreBusiness.Enums;

public enum MesocyclePhase
{
    [Description("Přípravné")]
    Preparation = 0,
    [Description("Předsoutěžní")]
    PreCompetition = 1,
    [Description("Soutěžní")]
    Competition = 2,
    [Description("Přechodné")]
    Transition = 3,
    [Description("Regenerační")]
    Regeneration = 4
}
