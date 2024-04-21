USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_TrainingParts]    Script Date: 14.03.2024 12:47:04 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_TrainingParts]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	@Name NVARCHAR(Max), 
	@Description NVARCHAR(Max),    
	@Order int,
	@Duration int,
	@TrainingId int         

    DECLARE cur CURSOR for SELECT
            [Id],
      [Name]
      ,[Description]
      ,[Order]
      ,[TrainingId]
      ,[Duration]
  FROM [dbo].[TrainingParts];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @Name, @Description, @Order, @TrainingId,@Duration;
	 print 'SET IDENTITY_INSERT [dbo].[TrainingParts] ON;';
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print N'INSERT INTO [dbo].[TrainingParts]
           ([Id],[Name]
           ,[Description]
           ,[Order]
           ,[TrainingId]
           ,[Duration])
     VALUES ('
			+ CAST(@Id AS NVARCHAR(10))
			+ ', N''' + @Name + ''''
			+ ', ' + CASE ISNULL( @Description, '') WHEN '' then 'null' else N'''' +  @Description + '''' end 
			+ ', ' + CAST(@Order AS NVARCHAR(10))			
			+ ', ' + CAST(@TrainingId AS NVARCHAR(10))
			+ ', ' + CAST(@Duration AS NVARCHAR(10))
			+');';		

        FETCH NEXT FROM cur INTO @Id, @Name, @Description, @Order, @TrainingId,@Duration;
    END;
	   print 'SET IDENTITY_INSERT [dbo].[TrainingParts] OFF;'; 
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

