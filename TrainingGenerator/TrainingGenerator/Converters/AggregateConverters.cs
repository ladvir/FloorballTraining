using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Data;

namespace TrainingGenerator.Converters
{
    public class MaxConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            if (value == null) return 0.0;  // if there is no value return 0.0
            if (parameter == null) return 0.0;  // if there is no parameter return 0.0

            double Max = 0.0; // initialize a variable to keep track of the highest value

            Type ValueType = value.GetType(); // get the type of the provided value

            if (ValueType.Name == typeof(List<>).Name)
            { // Check if we're dealing with a list
                //if so, loop thru all items in the list
                foreach (var item in (IList)value)
                {
                    Type ItemType = item.GetType(); // Get the type of the item
                    PropertyInfo ItemPropertyInfo = ItemType.GetProperty((string)parameter);

                    double ItemValue = (double)ItemPropertyInfo.GetValue(item, null); // get the actual value of the item

                    if (ItemValue > Max) // compare ..
                        Max = ItemValue; // .. and assign value to max if needed
                }
                return Max;
            }
            return 0.0; // It's not a list so return 0.0
        }

        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }

    public class SumConverter : IValueConverter
    {
        #region IValueConverter Members

        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            if (value == null || parameter == null)
                return 0.0;  // if there is no value or no parameter return 0.0
            double Sum = 0.0; // initialize a variable to calculate the sum

            // Check if we're dealing with a list
            if (value.GetType().Name == typeof(List<>).Name)
            {
                //if so, loop thru all items in the list
                foreach (var item in (IList)value)
                {
                    //get the type, the property and than the value and add it to sum
                    Sum += (double)item.GetType().GetProperty((string)parameter).GetValue(item, null);
                }
                return Sum;
            }
            return 0.0; // It's not a list so return 0.0
        }

        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            throw new NotImplementedException();
        }

        #endregion IValueConverter Members
    }

    public class AverageConverter : IValueConverter
    {
        #region IValueConverter Members

        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            if (value == null || parameter == null)
                return 0.0;  // if there is no value or no parameter return 0.0
            double Sum = 0.0; // initialize a variable to calculate the sum

            // Check if we're dealing with a list
            if (value.GetType().Name == typeof(List<>).Name)
            {
                //if so, loop thru all items in the list
                foreach (var item in (IList)value)
                {
                    //get the type, the property and than the value and add it to sum
                    Sum += (double)item.GetType().GetProperty((string)parameter).GetValue(item, null);
                }
                if (((IList)value).Count > 0) // prevent a division by zero
                    return Sum / ((IList)value).Count;
                else
                    return 0.0;
            }
            return 0.0; // It's not a list so return 0.0
        }

        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            throw new NotImplementedException();
        }

        #endregion IValueConverter Members
    }
}