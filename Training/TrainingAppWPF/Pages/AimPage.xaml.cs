using Domain;
using Repository;
using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using TrainingAppWPF.Windows;

namespace TrainingAppWPF.Pages
{
    public partial class AimPage : Page
    {
        public IEnumerable<Aim> Aims = new List<Aim>();
        private readonly AimRepository _aimRepository = new AimRepository(Helper.ConnectionStringValue("Training"));

        private Aim _selectedAim;

        public AimPage()
        {
            InitializeComponent();

            GetAims();
        }

        private void UpdateBinding()
        {
            AimDataGrid.ItemsSource = Aims;
        }


        private void NewButton_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(SearchTextBox.Text)) return;

            try
            {
                _aimRepository.Insert(SearchTextBox.Text.Normalize());
            }
            catch (Exception x)
            {
                MessageBox.Show(x.Message);
            }

            UpdateBinding();
            SearchTextBox.Text = string.Empty;
        }

        private void EditButton_Click(object sender, RoutedEventArgs e)
        {
            if (_selectedAim != null)
            {
                OpenAimWindow();

                GetAims();
                return;
            }

            UpdateBinding();
        }

        private void OpenAimWindow()
        {
            var aimWindow = new AimWindow(_selectedAim);
            aimWindow.ShowDialog();

            _selectedAim = null;
            GetAims();
        }

        private void DeleteButton_Click(object sender, RoutedEventArgs e)
        {
            if (_selectedAim != null && _selectedAim.ActivitiesCount == 0)
            {
                MessageBoxResult messageBoxResult = MessageBox.Show($"Opravdu chcete smazat {_selectedAim.Name}?", "Smazat", MessageBoxButton.YesNo);
                if (messageBoxResult == MessageBoxResult.Yes)

                    try
                    {
                        _aimRepository.Delete(_selectedAim.Id);
                    }
                    catch (Exception x)
                    {
                        MessageBox.Show(x.Message);
                    }
                _selectedAim = null;

                GetAims();
                return;
            }
            UpdateBinding();
        }

        private void SearchTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            GetAims();
        }

        private void GetAims()
        {
            try
            {
                Aims = !string.IsNullOrEmpty(SearchTextBox.Text)
                    ? _aimRepository.GetAimsByName(SearchTextBox.Text)
                    : _aimRepository.GetAllAims();
            }
            catch (Exception x)
            {
                MessageBox.Show(x.Message);
            }

            UpdateBinding();
        }

        private void AimDataGrid_OnSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var grid = (DataGrid)sender;

            if (grid.SelectedItem is Aim Aim) _selectedAim = Aim;
        }

        private void AimDataGrid_OnMouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            var grid = (DataGrid)sender;

            if (grid.SelectedItem is Aim aim) _selectedAim = aim;

            OpenAimWindow();

        }
    }
}
