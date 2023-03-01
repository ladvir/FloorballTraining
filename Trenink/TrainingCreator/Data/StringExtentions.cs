namespace TrainingCreator.Data
{
    public static class StringExtentions
    {

        public static string GetRangeString(int? min, int? max)
        {
            int minValue = min.GetValueOrDefault(0);
            int maxValue = max.GetValueOrDefault(0);

            return minValue switch
            {
                > 0 when maxValue > 0 => minValue + " - " + maxValue,
                <= 0 when maxValue > 0 => " max. " + maxValue,
                > 0 => " min. " + minValue,
                _ => "..."
            };
        }


        public static string TruncateLongString(this string str, int maxLength)
        {

            const string dots = "...";
            var length = Math.Min(str.Length, maxLength);
            return length + 3 < maxLength ? str : str[0..(length - 3)] + dots;
        }

    }
}
