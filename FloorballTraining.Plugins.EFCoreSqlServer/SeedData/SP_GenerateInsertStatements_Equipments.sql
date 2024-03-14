USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_Equipments]    Script Date: 14.03.2024 12:45:49 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_Equipments]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	@Name NVARCHAR(Max)
	 
      

    DECLARE cur CURSOR for SELECT
            [Id]
			,[Name]
      
  FROM [dbo].[Equipments];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @Name;
	print 'SET IDENTITY_INSERT [dbo].[Equipments] ON;'
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print N' INSERT INTO [dbo].[Equipments] ([Id], [Name]) VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ', N''' + @Name + ''''			
			
			+');';		

        FETCH NEXT FROM cur INTO @Id, @Name;
    END;
	   print 'SET IDENTITY_INSERT [dbo].[Equipments] OFF;'
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

