using System.ComponentModel;
using System.Reflection;

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

public static class AgeGroupExtension
{
    public static string
        GetDescription(this Enum genericEnum) //Hint: Change the method signature and input paramter to use the type parameter T
    {
        Type genericEnumType = genericEnum.GetType();
        MemberInfo[] memberInfo = genericEnumType.GetMember(genericEnum.ToString());
        if ((memberInfo.Length > 0))
        {
            var attribs = memberInfo[0].GetCustomAttributes(typeof(DescriptionAttribute), false);
            if ((attribs.Any()))
            {
                return ((DescriptionAttribute)attribs.ElementAt(0)).Description;
            }
        }

        return genericEnum.ToString();
    }

    public static IEnumerable<AgeGroup> GetValues(this AgeGroup ageGroup)
    {
        return Enum.GetValues(typeof(AgeGroup)).Cast<AgeGroup>();
    }
}