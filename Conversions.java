import java.util.Scanner;

public class Conversions {

  public static void main(String[] args) {
    char mode = ' ';
    char devise = ' ';
    double amount = 0;
    Scanner saisie = new Scanner(System.in);

    // Je m assure que l utilisateur entre les mode disponible sur le menu
    do {
      AffichagePrincipale();
      mode = saisie.next().charAt(0);
      if (mode != '1' && mode != '2') {
        System.out.println("Choix indisponible .Veuiller entrer le bon mode ");
      }

    } while (mode != '1' && mode != '2');

    
     
 do {
      
      System.out.println("Veuillez entrer le montant a convertir ");
      
     amount = saisie.nextDouble();
      System.out.println("Veuiller choisir la devise :");
      System.out.println("1- DOLLARS AMERICAIN");
      System.out.println("2- EURO ");
      System.out.println("3 - ROUBLE");
      System.out.println("4- YUAN ");
      System.out.println("5- LIVRE STERLING ");

      devise = saisie.next().charAt(0);
      if (devise != '1' && devise != '2' && devise != '3' && devise != '4' && devise != '5') {
        System.out.println("Veuillez faire votre chois parmi ceux disponible au menu ...");
      }
    } while (devise != '1' && devise != '2' && devise != '3' && devise != '4' && devise != '5');

    CfaExchange(mode, amount, devise);
    Result(CfaExchange(mode, amount, devise), amount, devise);
  }

  // Fonction qui affiche le menu principale

  static void AffichagePrincipale() {
    System.out.println("------ Convertion Monaitaire-------");
    System.out.println("Ce programme convertie le franc CFA en d autres devises et inversemment");
    System.out.println("-------------------------------");
    System.out.println("Veuiller selectionner le mode");
    System.out.println("1- FRANC CFA - AUTRES DEVISES (USD,EURO,LIVRE,YUAN,ROUBLE)");
    System.out.println("2- AUTRES DEVISES (USD,EURO,LIVRE,YUAN,ROUBLE) - FRANC CFA");

  }

  // Cette fonction me permet de faire la convertion du franc cfa vers les autres
  // devises
  static double CfaExchange(char mode, double amount, char devise) {
    double convertedAmount = 0;

    if (mode == '1') {
      switch (devise) {
        case '1':
          convertedAmount = amount * 560;
          break;
        case '2':
          convertedAmount = amount * 660;
          break;
        case '3':
          convertedAmount = amount * 6;
          break;
        case '4':
          convertedAmount = amount * 8;
          break;
        case '5':
          convertedAmount = amount * 752;
          break;

        default:
          convertedAmount = amount;
          break;
      }

    } else {
      switch (devise) {
        case '1':
          convertedAmount = amount / 560;
          break;
        case '2':
          convertedAmount = amount /660;
          break;
        case '3':
          convertedAmount = amount / 6;
          break;
        case '4':
          convertedAmount = amount / 8;
          break;
        case '5':
          convertedAmount = amount / 752;
          break;

        default:
          convertedAmount = amount;
          break;
      }

    }

    return convertedAmount;
  }



 
  
  // Affiche le resultat en fonction du mode

  static void Result(double CfaExchange, double amount, char devise) {
    
      switch (devise) {
        case '1':
          System.out.println(CfaExchange + "  USD vaut ou vallent  " + amount + " XAF");
          break;
        case '2':
          System.out.println(CfaExchange + " EURO vaut ou vallent  " + amount + " XAF");
          break;
        case '3':
          System.out.println(CfaExchange + " RUB vaut ou vallent  " + amount + " XAF");
          break;
        case '4':
          System.out.println(CfaExchange + " CNY vaut ou vallent  " + amount + " XAF");
          break;
        case '5':
          System.out.println(CfaExchange + " GBP vaut ou vallent  " + amount + " XAF");
          break;

        default:
          System.out.println("Affichage indisponible...");
          break;
      
      }

    }


  
}

