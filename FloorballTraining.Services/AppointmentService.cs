using ClosedXML.Excel;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;


namespace FloorballTraining.Services
{
    public class AppointmentService : IAppointmentService
    {

        private const double WorkTimeMatch = 2.5;
        public void GenerateFutureAppointments(AppointmentDto appointment,
            RepeatingFrequency repeatingFrequency, int interval, DateTime? repeatingEnd,
            bool updateAllFutureAppointments)
        {
            if (repeatingFrequency == RepeatingFrequency.Once)
            {
                appointment.RepeatingPattern = null;
                return;
            }

            var repeatingPattern = appointment.RepeatingPattern ?? new RepeatingPatternDto();

            repeatingPattern.EndDate ??= repeatingEnd;
            repeatingPattern.StartDate = appointment.Start;
            repeatingPattern.RepeatingFrequency = repeatingFrequency;
            repeatingPattern.Interval = interval;
            repeatingPattern.InitialAppointment = appointment;

            appointment.RepeatingPattern = repeatingPattern;

            //remove all future ones and recreate them again
            appointment.FutureAppointments.RemoveAll(f => !f.IsPast);

            if (appointment.ParentAppointment != null)
            {
                UpdatePattern(repeatingPattern, appointment.ParentAppointment, repeatingFrequency, interval, repeatingEnd);
            }
            else
            {
                UpdatePattern(repeatingPattern, appointment, repeatingFrequency, interval, repeatingEnd);
            }
        }

        public void GenerateFutureAppointments(RepeatingPatternDto repeatingPattern, AppointmentDto template)
        {
            if (repeatingPattern.RepeatingFrequency == RepeatingFrequency.Once) return;

            var currentDate = GetNextDate(repeatingPattern, template.Start);

            while (repeatingPattern.EndDate == null || currentDate <= repeatingPattern.EndDate.Value.AddSeconds(-1))
            {
                var newAppointment = new AppointmentDto
                {
                    RepeatingPattern = repeatingPattern,
                    Start = currentDate,
                    End = currentDate.Add(template.End - template.Start),
                    AppointmentType = template.AppointmentType,
                    LocationId = template.LocationId,
                    LocationName = template.LocationName,
                    TrainingName = template.TrainingName,
                    TrainingTargets = template.TrainingTargets,
                    TeamId = template.TeamId,
                    TrainingId = template.TrainingId,
                    ParentAppointment = template,
                    Description = template.Description,
                    Name = template.Name
                };

                repeatingPattern.FutureAppointments.Add(newAppointment);
                template.FutureAppointments.Add(newAppointment);

                // Move to the next appointment date
                currentDate = GetNextDate(repeatingPattern, currentDate);
            }
        }

        private DateTime GetNextDate(RepeatingPatternDto repeatingPattern, DateTime currentDate)
        {
            return repeatingPattern.RepeatingFrequency switch
            {
                RepeatingFrequency.Daily => currentDate.AddDays(repeatingPattern.Interval),
                RepeatingFrequency.Weekly => currentDate.AddDays(7 * repeatingPattern.Interval),
                RepeatingFrequency.Monthly => currentDate.AddMonths(repeatingPattern.Interval),
                RepeatingFrequency.Once => repeatingPattern.EndDate.GetValueOrDefault(),
                RepeatingFrequency.Yearly => currentDate.AddYears(repeatingPattern.Interval),
                _ => currentDate
            };
        }

        public void UpdatePattern(RepeatingPatternDto repeatingPattern, AppointmentDto template, RepeatingFrequency repeatingFrequency, int interval, DateTime? endDate = null)
        {
            repeatingPattern.RepeatingFrequency = repeatingFrequency;
            repeatingPattern.Interval = interval;
            repeatingPattern.EndDate = endDate;

            // Regenerate future appointments based on the updated pattern
            GenerateFutureAppointments(repeatingPattern, template);
        }

        public Task<byte[]?> GenerateWorkTimeExcel(AppointmentsExportDto exportData)
        {

            if (exportData.Appointments == null || !exportData.Appointments.Any()) return Task.FromResult<byte[]?>(null);
            using var workbook = new XLWorkbook();
            workbook.ShowRowColHeaders = true;
            workbook.CalculateMode = XLCalculateMode.Auto;

            var appointmentMonth = exportData.Appointments.GroupBy(a => new { a.Start.Year, a.Start.Month });


            foreach (var month in appointmentMonth)
            {
                var worksheet = workbook.AddWorksheet();
                worksheet.Name = $"{month.Key.Month}-{month.Key.Year}";
                worksheet.ShowRowColHeaders = true;

                worksheet.Column("A").Width = 6;
                worksheet.Column("B").Width = 8;
                worksheet.Column("C").Width = 10;
                worksheet.Column("D").Width = 10;
                worksheet.Column("E").Width = 10;
                worksheet.Column("F").Width = 8;
                worksheet.Column("G").Width = 8;
                worksheet.Column("H").Width = 5;
                worksheet.Column("I").Width = 5;
                worksheet.Column("J").Width = 5;
                worksheet.Column("K").Width = 5;
                worksheet.Column("L").Width = 5;

                worksheet.Range("A1:B1").Merge().SetStyleHeader().Style.Alignment.ShrinkToFit = true;
                worksheet.Cell("A1").Value = "Výkaz práce:";

                worksheet.Range("C1:E1").Merge().SetStyleHeader();

                worksheet.Cell("C1").Value = exportData.TeamName;

                worksheet.Cell("F1").Value = new DateTime(month.Key.Year, month.Key.Month, 1).ToString("MMMM");
                worksheet.Cell("F1").SetStyleHeader();
                worksheet.Cell("G1").Value = month.Key.Year;
                worksheet.Cell("G1").SetStyleHeader();
                worksheet.Cell("H1").Value = "jméno";
                worksheet.Range("I1:L1").Merge().SetStyleHeader();
                worksheet.Cell("I1").Value = exportData.CoachName;
                worksheet.Cell("I1").SetStyleHeader().Style.Alignment.SetWrapText(true);

                worksheet.Range("A2:A3").Merge().SetStyleColumnHeader();
                worksheet.Cell("A2").Value = "Den";
                worksheet.Range("B2:B3").Merge().SetStyleColumnHeader().Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);

                worksheet.Cell("B2").Value = "Pracoviště";
                worksheet.Range("C2:G3").Merge().SetStyleColumnHeader().Style.Alignment.SetWrapText(true);
                worksheet.Cell("C2").Value = "Popis práce";
                worksheet.Range("H2:J2").Merge().SetStyleColumnHeader();
                worksheet.Cell("H2").Value = "pracováno";
                worksheet.Cell("H2").SetStyleColumnHeader().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell("H3").Value = "od";
                worksheet.Cell("H3").SetStyleColumnHeader();
                worksheet.Cell("I3").Value = "do";
                worksheet.Cell("I3").SetStyleColumnHeader();
                worksheet.Cell("J3").Value = "hodin";
                worksheet.Cell("J3").SetStyleColumnHeader();

                worksheet.Range("K2:K3").Merge().SetStyleColumnHeader().Style.Alignment.SetWrapText(true);
                worksheet.Cell("K2").Value = "hl.pořadatel";
                worksheet.Range("L2:L3").Merge().SetStyleColumnHeader().Style.Alignment.SetWrapText(true);
                worksheet.Cell("L2").Value = "pořadatel";


                //trainings rows
                var rowIndexFirstData = 4;
                var rowIndex = rowIndexFirstData;
                for (var d = 1; d <= DateTime.DaysInMonth(month.Key.Year, month.Key.Month); d++, rowIndex++)
                {
                    worksheet.Cell(rowIndex, 1).Value = d;

                    var day = d;
                    var dayTrainings = month.Where(m => m.Start.Day == day && (m.AppointmentType == AppointmentType.Training || m.AppointmentType == AppointmentType.Match)).ToArray();
                    var promotions = month.Where(m => m.Start.Day == day && m.AppointmentType == AppointmentType.Promotion).ToArray();

                    var dayRows = Math.Max(dayTrainings.Length, promotions.Length);

                    if (dayRows == 0)
                    {
                        continue;
                    }

                    var trainingRowAdded = false;
                    for (var i = 0; i < dayRows; i++, rowIndex++)
                    {
                        if (dayTrainings.Length > i)
                        {


                            if (dayTrainings[i].AppointmentType == AppointmentType.Training)
                            {
                                var descriptionText = string.IsNullOrEmpty(dayTrainings[i].TrainingName)
                                    ? dayTrainings[i].Name
                                    : $"{dayTrainings[i].TrainingName} - {dayTrainings[i].TrainingTargets}";
                                SetTrainingRow(worksheet, rowIndex, dayTrainings[i].LocationName, descriptionText,
                                    dayTrainings[i].Start, dayTrainings[i].End);
                            }

                            if (dayTrainings[i].AppointmentType == AppointmentType.Match)
                            {

                                SetTrainingRow(worksheet, rowIndex, dayTrainings[i].LocationName, dayTrainings[i].Name,
                                    dayTrainings[i].Start.Date.Add(new TimeSpan(8, 0, 0)), dayTrainings[i].Start.Date.Add(new TimeSpan(10, 30, 0)), WorkTimeMatch);
                            }


                            trainingRowAdded = true;
                        }

                        if (promotions.Length > i)
                        {
                            SetPromotionRow(worksheet, rowIndex, promotions[i].Start, promotions[i].End, null, null);
                            trainingRowAdded = true;
                        }
                    }

                    if (trainingRowAdded)
                    {
                        rowIndex--;
                    }
                }

                for (var i = rowIndexFirstData; i <= rowIndex; i++)
                {
                    worksheet.Range(i, 3, i, 7).Merge();
                }

                var rowIndexLastData = rowIndex;

                worksheet.Cell("A" + rowIndex).Value = "Celkem";
                worksheet.Range("A" + rowIndex, "B" + rowIndex).Merge().SetStyleTotalSummary();

                worksheet.Cell("C" + rowIndex).Value = "Trénování";
                worksheet.Range("C" + rowIndex, "G" + rowIndex).Merge().SetStyleTotalSummary();

                //worksheet.Cell("H" + rowIndex).Value = month.Where(m => m.AppointmentType == AppointmentType.Training).Sum(a => (a.End - a.Start).TotalHours);

                worksheet.Range("H" + rowIndex).FormulaA1 = $"SUM(J{rowIndexFirstData}:J{rowIndexLastData - 1})";

                worksheet.Range("H" + rowIndex, "J" + rowIndex).Merge().SetStyleTotalSummary();

                worksheet.Range("K" + rowIndex).FormulaA1 = $"SUM(K{rowIndexFirstData}:K{rowIndexLastData - 1})";
                worksheet.Cell("K" + rowIndex).SetStyleTotalSummary();

                worksheet.Range("L" + rowIndex).FormulaA1 = $"SUM(L{rowIndexFirstData}:L{rowIndexLastData - 1})";
                worksheet.Cell("L" + rowIndex).SetStyleTotalSummary();

                rowIndex++;
                worksheet.Cell("A" + rowIndex).Value = "Příprava";
                worksheet.Range("A" + rowIndex, "B" + rowIndex).Merge().SetStyleTotalSummary();
                worksheet.Range("C" + rowIndex, "G" + rowIndex).Merge().SetStyleTotalSummary();
                worksheet.Cell("H" + rowIndex).Value = exportData.Preparation;
                worksheet.Range("H" + rowIndex, "J" + rowIndex).Merge().SetStyleTotalSummary();

                rowIndex++;
                worksheet.Cell("A" + rowIndex).Value = "Akce";
                worksheet.Range("A" + rowIndex, "B" + rowIndex).Merge().SetStyleTotalSummary();

                worksheet.Range("C" + rowIndex, "G" + rowIndex).Merge().SetStyleTotalSummary();
                worksheet.Cell("C" + rowIndex).Value = string.Join(", ", month.Where(m => m.AppointmentType == AppointmentType.Other).Select(x => x.Name));

                worksheet.Cell("H" + rowIndex).Value = month.Count(m => m.AppointmentType == AppointmentType.Other);
                worksheet.Range("H" + rowIndex, "J" + rowIndex).Merge().SetStyleTotalSummary();

                rowIndex++;
                worksheet.Cell("A" + rowIndex).Value = "Pořádání";
                worksheet.Range("A" + rowIndex, "B" + rowIndex).Merge().SetStyleTotalSummary();
                worksheet.Range("C" + rowIndex, "G" + rowIndex).Merge().SetStyleTotalSummary();
                worksheet.Range("H" + rowIndex).FormulaA1 = $"SUM(L{rowIndexLastData}:K{rowIndexLastData})";


                worksheet.Range("K" + rowIndex).FormulaA1 = $"K{rowIndexLastData}";
                worksheet.Cell("K" + rowIndex).SetStyleTotalSummary();

                worksheet.Range("H" + rowIndex, "J" + rowIndex).Merge().SetStyleTotalSummary();


                rowIndex++;
                worksheet.Cell("A" + rowIndex).Value = @"CELEM ODPRACOVÁNO ZA MĚSÍC / PODPIS";
                worksheet.Range("A" + rowIndex, "G" + rowIndex).Merge().SetStyleTotalSummary();
                worksheet.Cell("H" + rowIndex).Value = month.Where(m => m.AppointmentType is AppointmentType.Training or AppointmentType.Promotion).Sum(a => (a.End - a.Start).TotalHours);

                worksheet.Range("H" + rowIndex).FormulaA1 = $"H{rowIndexLastData}+H{rowIndexLastData + 1}+H{rowIndex - 1}";
                worksheet.Range("H" + rowIndex, "J" + rowIndex).Merge().SetStyleTotalSummary();


                //borders

                //all cells
                worksheet.Range(1, 1, rowIndex, 12).Style
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetOutsideBorder(XLBorderStyleValues.Medium);

                //header
                worksheet.Range(1, 1, rowIndexFirstData - 1, 12).Style
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetOutsideBorder(XLBorderStyleValues.Medium);

                //summary
                worksheet.Range(rowIndexLastData, 1, rowIndex, 12).Style
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetOutsideBorder(XLBorderStyleValues.Medium);

            }

            using var stream = new MemoryStream();
            workbook.CalculationOnSave = true;

            workbook.SaveAs(stream, true, true);
            return Task.FromResult(stream.ToArray())!; // Return the byte array
        }

        private void SetTrainingRow(IXLWorksheet worksheet, int rowIndex, string? locationName, string? trainingName, DateTime? start, DateTime? end, double? fixedTime = null)
        {
            worksheet.Cell(rowIndex, 2).Value = locationName;
            worksheet.Cell(rowIndex, 2).SetStyleNormal().Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetWrapText(true);

            worksheet.Cell(rowIndex, 3).Value = trainingName;
            worksheet.Cell(rowIndex, 3).SetStyleNormal().Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Left).Alignment.SetWrapText(true);

            worksheet.Cell(rowIndex, 8).Value = start.GetValueOrDefault().ToString("HH:mm");
            worksheet.Cell(rowIndex, 8).SetStyleNormal().Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            worksheet.Cell(rowIndex, 9).Value = end.GetValueOrDefault().ToString("HH:mm");
            worksheet.Cell(rowIndex, 9).SetStyleNormal().Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            worksheet.Cell(rowIndex, 10).Value =
                fixedTime != null
                    ? fixedTime
                    : (end.GetValueOrDefault() - start.GetValueOrDefault()).TotalHours;


            worksheet.Cell(rowIndex, 10).SetStyleNormal().Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);
        }
        private static void SetPromotionRow(IXLWorksheet worksheet, int rowIndex, DateTime? mainStart, DateTime? mainEnd, DateTime? start, DateTime? end)
        {
            worksheet.Cell(rowIndex, 11).Value = (mainStart.HasValue && mainEnd.HasValue)
                ? (mainEnd.GetValueOrDefault() - mainStart.GetValueOrDefault()).TotalHours
                : string.Empty;

            worksheet.Cell(rowIndex, 11).SetStyleNormal();

            worksheet.Cell(rowIndex, 12).Value = (start.HasValue && end.HasValue)
                ? (end.GetValueOrDefault() - start.GetValueOrDefault()).TotalHours
                : string.Empty;
            worksheet.Cell(rowIndex, 12).SetStyleNormal();
        }
    }

    public static class MyExtensions
    {
        public static IXLRange SetStyleHeader(this IXLRange x)
        {
            x.Style.Font.SetFontSize(12).Font.SetFontName("Arial").Font.SetBold(true).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            return x;
        }

        public static IXLCell SetStyleHeader(this IXLCell x)
        {
            x.Style.Font.SetFontSize(12).Font.SetFontName("Arial").Font.SetBold(true).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            return x;
        }

        public static IXLRange SetStyleColumnHeader(this IXLRange x)
        {
            x.Style.Font.SetFontSize(8).Font.SetFontName("Arial").Font.SetItalic(true).Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            return x;
        }

        public static IXLCell SetStyleColumnHeader(this IXLCell x)
        {
            x.Style.Font.SetFontSize(8).Font.SetFontName("Arial").Font.SetItalic(true).Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            return x;
        }

        public static IXLRange SetStyleNormal(this IXLRange x)
        {
            x.Style.Font.SetFontSize(11).Font.SetFontName("Calibri").Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            return x;
        }

        public static IXLCell SetStyleNormal(this IXLCell x)
        {
            x.Style.Font.SetFontSize(11).Font.SetFontName("Calibri").Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            return x;
        }

        public static IXLRange SetStyleTotalSummary(this IXLRange x)
        {
            x.Style.Font.SetFontSize(11).Font.SetFontName("Calibri").Font.SetBold(true).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            return x;
        }

        public static IXLCell SetStyleTotalSummary(this IXLCell x)
        {
            x.Style.Font.SetFontSize(11).Font.SetFontName("Calibri").Font.SetBold(true).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            return x;
        }
    }
}
