using System.ComponentModel;

namespace FloorballTraining.CoreBusiness
{
    public enum MediaType
    {
        Image,
        Video,
        URL
    }

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
