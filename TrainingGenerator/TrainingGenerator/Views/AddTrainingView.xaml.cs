using System.Linq;
using System.Windows.Controls;
using TrainingGenerator.Models;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Views
{
    public partial class AddTrainingView : UserControl
    {
        public AddTrainingView()
        {
            InitializeComponent();
        }

        private void ActivitiesListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var viewmodel = (AddTrainingViewModel)DataContext;
            viewmodel.SelectedTrainingActivities = ActivitiesListView.SelectedItems
                .Cast<TrainingActivity>()
                .ToList();
        }
    }
}