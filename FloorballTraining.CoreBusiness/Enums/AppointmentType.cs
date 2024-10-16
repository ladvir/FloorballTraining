using System.ComponentModel;

namespace FloorballTraining.CoreBusiness.Enums;

public enum AppointmentType
{
    [Description("Trénink")]
    Training,
    [Description("Soustředění")]
    Camp,
    [Description("Pořádání")]
    Promotion,
    [Description("Zápas")]
    Match,
    [Description("Jiná")]
    Other
}