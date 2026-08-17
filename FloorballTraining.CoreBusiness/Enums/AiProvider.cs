namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>Supported AI providers. Behaviour lives in code — adding a provider is a code change.</summary>
public enum AiProvider
{
    Anthropic = 0,
    OpenAi = 1,
    Gemini = 2,
}
