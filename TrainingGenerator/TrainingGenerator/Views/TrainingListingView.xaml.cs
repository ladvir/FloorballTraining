using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Views
{
    public partial class TrainingListingView : UserControl
    {
        public TrainingListingView()
        {
            InitializeComponent();
        }

        private void UserControl_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            TrainingsListView.MaxHeight = e.NewSize.Height - 100;
        }

        private void ListViewItem_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            var detail = (TrainingListingViewModel)DataContext;

            detail.SelectedTraining = (TrainingViewModel)((ListViewItem)sender).Content;

            detail.OpenTrainingCommand.Execute(detail.SelectedTraining);
        }
    }
}