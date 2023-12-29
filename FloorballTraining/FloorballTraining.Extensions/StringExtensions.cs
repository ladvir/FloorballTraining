namespace FloorballTraining.Extensions
{
    public static class StringExtensions
    {
        public static string GetRangeString(int min, int max)
        {
            int minValue = min;
            int maxValue = max;

            return minValue switch
            {
                > 0 when maxValue > 0 && minValue != maxValue => minValue + " - " + maxValue,
                > 0 when maxValue > 0 && minValue == maxValue => minValue.ToString(),
                <= 0 when maxValue > 0 => " max. " + maxValue,
                > 0 => " min. " + minValue,
                _ => "..."
            };
        }

        public static string GetRangeString(string min, string max)
        {
            if (!string.IsNullOrEmpty(min))
            {
                if (!string.IsNullOrEmpty(max) && !min.Equals(max)) return min + " - " + max;

                return min;
            }

            if (!string.IsNullOrEmpty(max)) return max;

            return string.Empty;
        }

        public static string? TruncateLongString(this string str, int maxLength)
        {

            const string dots = "...";
            var length = Math.Min(str.Length, maxLength);
            return length + 3 < maxLength ? str : str[0..(length - 3)] + dots;
        }
    }
}
