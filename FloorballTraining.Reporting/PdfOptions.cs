namespace FloorballTraining.Reporting;

public class PdfOptions
{
    /// <summary>Věk. kategorie, Doba trvání, Intenzita, Obtížnost</summary>
    public bool IncludeTrainingParameters { get; set; } = true;

    /// <summary>Zaměření, Vybavení, Prostředí</summary>
    public bool IncludeTrainingDetails { get; set; } = true;

    /// <summary>Popis tréninku</summary>
    public bool IncludeTrainingDescription { get; set; } = true;

    /// <summary>Komentář před/po tréninku</summary>
    public bool IncludeComments { get; set; } = true;

    /// <summary>Popis jednotlivých částí tréninku</summary>
    public bool IncludePartDescriptions { get; set; } = true;

    /// <summary>Popisy aktivit uvnitř tréninkových skupin</summary>
    public bool IncludeActivityDescriptions { get; set; } = true;

    /// <summary>Obrázky aktivit</summary>
    public bool IncludeImages { get; set; } = true;
}
