namespace FloorballTraining.Extensions
{
    public static class StringExtensions
    {
        public static string GetRangeString(int? min, int? max)
        {
            return GetRangeString(min.ToString(), max.ToString());
        }

        public static string GetRangeString(string? min, string? max)
        {
            if (!string.IsNullOrEmpty(min))
            {
                if (!string.IsNullOrEmpty(max) && !min.Equals(max)) return min + "-" + max;

                return min;
            }

            if (!string.IsNullOrEmpty(max)) return max;

            return string.Empty;
        }


        public static string GetRangeString(IEnumerable<RangeDescription> ranges, string? separator = " + ")
        {
            var result = string.Empty;
            foreach (var range in ranges)
            {
                if (!string.IsNullOrEmpty(result) && (range.Min > 0 || range.Max > 0))
                {
                    result = $"{result}({range.ToString()})";
                }
                else
                {
                    result = $"{result}{range.ToString()}";
                }
            }

            return result;
        }

        public static string GetRangeString(int? minA, int? maxA, string? unitA, int? minB, int? maxB, string? unitB, string? rangeSeparator, string? separator = " + ")
        {
            return GetRangeString(new List<RangeDescription>
            {
                new() { Min = minA, Max = maxA, Unit = unitA, RangeSeparator = rangeSeparator},
                new() { Min = minB, Max = maxB, Unit = unitB, RangeSeparator = rangeSeparator},
            });
        }

        public static string? TruncateLongString(this string str, int maxLength)
        {

            const string dots = "...";
            var length = Math.Min(str.Length, maxLength);
            return length + 3 < maxLength ? str : str[0..(length - 3)] + dots;
        }
    }
}
