USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_AgeGroups]    Script Date: 14.03.2024 12:45:13 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_AgeGroups]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	@Name NVARCHAR(Max), 
	 @Description NVARCHAR(Max)
      

    DECLARE cur CURSOR for SELECT
            [Id]
			,[Name]
      ,[Description]
  FROM [dbo].[AgeGroups];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @Name, @Description;
	print 'SET IDENTITY_INSERT [dbo].[AgeGroups] ON;'
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print N' INSERT INTO [dbo].[AgeGroups]
           ([Id],[Name]
           ,[Description]) VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ', N''' + @Name + ''''
			+ ', N''' + @Description + ''''			
			+');';		

        FETCH NEXT FROM cur INTO @Id, @Name, @Description;
    END;
	   print 'SET IDENTITY_INSERT [dbo].[AgeGroups] OFF;'
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

