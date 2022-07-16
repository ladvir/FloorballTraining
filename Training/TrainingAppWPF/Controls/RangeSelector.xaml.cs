using System;
using System.Windows;
using System.Windows.Controls;

namespace TrainingAppWPF.Controls
{
    /// <summary>
    /// Interaction logic for RangeSelector.xaml
    /// </summary>
    public partial class RangeSelector
    {
        private const double DifferenceTolerance = 0.001;

        public RangeSelector()
        {
            //DefaultStyleKeyProperty.OverrideMetadata(typeof(RangeSelector), new FrameworkPropertyMetadata(typeof(RangeSelector)));

            InitializeComponent();

        }

        /*
        public double ValueMin
        {
            get => (double)GetValue(ValueMinProperty);
            set => SetValue(ValueMinProperty, value);
        }
        public static readonly DependencyProperty ValueMinProperty = DependencyProperty.Register("RangeSelector", typeof(double), typeof(RangeSelector), new PropertyMetadata(null));

        public double ValueMax
        {
            get => (double)GetValue(ValueMaxProperty);
            set => SetValue(ValueMaxProperty, value);
        }
        public static readonly DependencyProperty ValueMaxProperty = DependencyProperty.Register("RangeSelector", typeof(double), typeof(RangeSelector), new PropertyMetadata(null));

        */


        private void Slider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (!(sender is Slider slider)) return;

            if (Math.Abs(slider.SelectionEnd - slider.SelectionStart) < DifferenceTolerance) return;
            if (e.NewValue > slider.SelectionEnd || e.NewValue < slider.SelectionStart)
            {
                slider.Value = e.OldValue;

            }
        }

        private void ThumbLeft_DragDelta(object sender, System.Windows.Controls.Primitives.DragDeltaEventArgs e)

        {

            var left = Canvas.GetLeft(ThumbLeft);

            var right = Canvas.GetLeft(ThumbRight);

            if (left + e.HorizontalChange < right && left + e.HorizontalChange > 0)

            {

                Canvas.SetLeft(ThumbLeft, left + e.HorizontalChange);

                Slider.SelectionStart = (left + e.HorizontalChange) / Slider.Width * 20;

                if (Slider.Value < Slider.SelectionStart)

                {

                    Slider.Value = Slider.SelectionStart;

                }

            }

        }

        private void ThumbRight_DragDelta(object sender, System.Windows.Controls.Primitives.DragDeltaEventArgs e)

        {

            var left = Canvas.GetLeft(ThumbLeft);

            var right = Canvas.GetLeft(ThumbRight);

            if (right + e.HorizontalChange > left && right + e.HorizontalChange < Slider.Width)

            {

                Canvas.SetLeft(ThumbRight, right + e.HorizontalChange);

                Slider.SelectionEnd = (right + e.HorizontalChange) / Slider.Width * 20;

                if (Slider.Value > Slider.SelectionEnd)

                {

                    Slider.Value = Slider.SelectionEnd;

                }

            }

        }
    }
}
