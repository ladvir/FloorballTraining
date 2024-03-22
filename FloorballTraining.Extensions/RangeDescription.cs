namespace FloorballTraining.Extensions
{
    public class RangeDescription
    {
        public int? Min { get; set; }
        public int? Max { get; set; }
        public string? Unit { get; set; } = string.Empty;
        public string? RangeSeparator { get; set; } = "-";

        public new string? ToString()
        {
            var result = string.Empty;
            if (Min >= 0)
            {
                if (Max >= 0 && !Min.Equals(Max))
                {
                    result = Min + RangeSeparator + Max;
                }
                else
                {
                    result = Min.ToString();
                }
            }
            else
            {
                if (Max > 0)
                {
                    result = Max.ToString();
                }
            }

            if (!string.IsNullOrEmpty(result)) result = string.Concat(result, Unit);

            return result;
        }
    }
}
