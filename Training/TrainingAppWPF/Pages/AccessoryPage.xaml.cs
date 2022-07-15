using Domain;
using Repository;
using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;

namespace TrainingAppWPF.Pages
{
    /// <summary>
    /// Interaction logic for AccessoryPage.xaml
    /// </summary>
    public partial class AccessoryPage : Page
    {
        public IEnumerable<Accessory> Accessories = new List<Accessory>();
        private readonly AccessoryRepository _accessoryRepository = new AccessoryRepository(Helper.ConnectionStringValue("Training"));

        private Accessory _selectedAccessory;

        public AccessoryPage()
        {
            InitializeComponent();

            GetAccessories();
        }

        private void UpdateBinding()
        {
            AccessoryDataGrid.ItemsSource = Accessories;
        }


        private void NewButton_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(SearchTextBox.Text)) return;

            try
            {
                _accessoryRepository.Insert(SearchTextBox.Text.Normalize());
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
            if (_selectedAccessory != null)
            {

                try
                {
                    _accessoryRepository.Update(_selectedAccessory.Id,
                        _selectedAccessory.Name + _selectedAccessory.Name);
                }
                catch (Exception x)
                {
                    MessageBox.Show(x.Message);
                }

                _selectedAccessory = null;

                GetAccessories();
                return;
            }

            UpdateBinding();
        }

        private void DeleteButton_Click(object sender, RoutedEventArgs e)
        {

            if (_selectedAccessory != null)
            {
                MessageBoxResult messageBoxResult = System.Windows.MessageBox.Show($"Opravdu chcete smazat {_selectedAccessory.Name}?", "Smazat", System.Windows.MessageBoxButton.YesNo);
                if (messageBoxResult == MessageBoxResult.Yes)

                    try
                    {
                        _accessoryRepository.Delete(_selectedAccessory.Id);
                    }
                    catch (Exception x)
                    {
                        MessageBox.Show(x.Message);
                    }
                _selectedAccessory = null;

                GetAccessories();
                return;
            }
            UpdateBinding();
        }

        private void SearchTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            GetAccessories();
        }

        private void GetAccessories()
        {
            Accessories = !string.IsNullOrEmpty(SearchTextBox.Text)
                ? _accessoryRepository.GetAccessoriesByName(SearchTextBox.Text)
                : _accessoryRepository.GetAllAccessories();


            UpdateBinding();
        }

        private void AccessoryDataGrid_OnSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var grid = (DataGrid)sender;

            if (grid.SelectedItem is Accessory accessory) _selectedAccessory = accessory;
        }
    }
}
