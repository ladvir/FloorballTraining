using Domain;
using Repository;
using System;
using System.Windows;
using System.Windows.Input;

namespace TrainingAppWPF.Windows
{
    public partial class ActivityWindow : Window
    {

        private readonly ActivityRepository _activityRepository = new ActivityRepository(Helper.ConnectionStringValue("Training"));
        public Activity Activity { get; set; }
        private readonly string _originalText;

        public ActivityWindow(Activity activity)
        {
            Owner = Application.Current.MainWindow;

            Activity = activity;

            _originalText = activity?.Name;
            InitializeComponent();
        }

        private void CancelButton_OnClick(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void SaveButton_OnClick(object sender, RoutedEventArgs e)
        {
            Save();
        }

        private void Save()
        {
            try
            {
                if (NameTextBox.Text != _originalText)
                    _activityRepository.Update(Activity.Id, NameTextBox.Text);

                Close();
            }
            catch (Exception x)
            {
                MessageBox.Show(x.Message);
            }
        }

        private void OnKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                Save();
            }

            if (e.Key == Key.Escape)
            {
                Close();
            }
        }

        private void DeleteButton_OnClick(object sender, RoutedEventArgs e)
        {

            if (Activity.Trainings.Count != 0)
            {
                MessageBox.Show($"Zaměření nelze smazat. Je používána v {Activity.Trainings.Count} trenincích");
                return;
            }

            MessageBoxResult messageBoxResult = MessageBox.Show($"Opravdu chcete smazat {Activity.Name}?", "Smazat", MessageBoxButton.YesNo);
            if (messageBoxResult == MessageBoxResult.Yes)

                try
                {
                    _activityRepository.Delete(Activity.Id);
                    Close();
                }
                catch (Exception x)
                {
                    MessageBox.Show(x.Message);
                }
        }
    }
}
