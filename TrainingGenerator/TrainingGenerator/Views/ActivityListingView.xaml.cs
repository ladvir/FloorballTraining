using System.Windows;
using System.Windows.Controls;

namespace TrainingGenerator.Views
{
    /// <summary>
    /// Interaction logic for ActivityListingView.xaml
    /// </summary>
    public partial class ActivityListingView : UserControl
    {
        public ActivityListingView()
        {
            InitializeComponent();
        }

        private void UserControl_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            ActivitiesListView.MaxHeight = e.NewSize.Height - 100;
        }
    }
}