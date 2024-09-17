using System.ComponentModel;

namespace FloorballTraining.CoreBusiness.Enums;

public enum RepeatingFrequency
{
    [Description("jednou")]
    Once = 0,
    [Description("den")]
    Daily = 1,
    [Description("týden")]
    Weekly = 2,
    [Description("měsíc")]
    Monthly = 3,
    [Description("rok")]
    Yearly = 4
}