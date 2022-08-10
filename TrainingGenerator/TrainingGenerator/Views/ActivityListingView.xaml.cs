using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using TrainingGenerator.ViewModels;

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

        private void ListViewItem_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            var detail = (ActivityListingViewModel)DataContext;

            detail.SelectedActivity = (ActivityViewModel)((ListViewItem)sender).Content;

            detail.OpenActivityCommand.Execute(detail.SelectedActivity);
        }
    }
}