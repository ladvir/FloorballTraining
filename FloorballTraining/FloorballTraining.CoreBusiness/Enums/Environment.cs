using System.ComponentModel;

namespace FloorballTraining.CoreBusiness.Enums
{
    public enum Environment
    {
        [Description("Kdekoliv")]
        Anywhere,
        [Description("Uvnitř")]
        Indoor,
        [Description("Venku")]
        Outdoor
    }

}
