using System.ComponentModel;
using System.Reflection;

namespace FloorballTraining.CoreBusiness;

public static class EnumExtension
{
    public static string GetDescription(this Enum genericEnum) //Hint: Change the method signature and input parameter to use the type parameter T
    {
        Type genericEnumType = genericEnum.GetType();
        MemberInfo[] memberInfo = genericEnumType.GetMember(genericEnum.ToString());
        if ((memberInfo.Length > 0))
        {
            var attributes = memberInfo[0].GetCustomAttributes(typeof(DescriptionAttribute), false);
            if ((attributes.Any()))
            {
                return ((DescriptionAttribute)attributes.ElementAt(0)).Description;
            }
        }

        return genericEnum.ToString();
    }
}