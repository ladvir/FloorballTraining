using System.ComponentModel;
using System.Reflection;

namespace FloorballTraining.CoreBusiness;

public static class EnumExtension
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

    public static IEnumerable<T> GetValues<T>(this Enum enumType) 
    {
        return Enum.GetValues(typeof(T)).Cast<T>();
    }
}