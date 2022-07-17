using Domain;
using Repository;
using System;
using System.Windows;
using System.Windows.Input;

namespace TrainingAppWPF.Windows
{
    public partial class AimWindow : Window
    {

        private readonly AimRepository _aimRepository = new AimRepository(Helper.ConnectionStringValue("Training"));
        public Aim Aim { get; set; }
        private readonly string _originalText;

        public AimWindow(Aim aim)
        {
            Owner = Application.Current.MainWindow;

            Aim = aim;

            _originalText = Aim.Name;
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
                    _aimRepository.Update(Aim.Id, NameTextBox.Text);

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

            if (Aim.ActivitiesCount != 0)
            {
                MessageBox.Show($"Zaměření nelze smazat. Je používána v {Aim.ActivitiesCount} aktivitách");
                return;
            }

            MessageBoxResult messageBoxResult = MessageBox.Show($"Opravdu chcete smazat {Aim.Name}?", "Smazat", MessageBoxButton.YesNo);
            if (messageBoxResult == MessageBoxResult.Yes)

                try
                {
                    _aimRepository.Delete(Aim.Id);
                    Close();
                }
                catch (Exception x)
                {
                    MessageBox.Show(x.Message);
                }
        }
    }
}
